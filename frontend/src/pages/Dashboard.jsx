import { useEffect, useState } from 'react';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { dashboardService } from '../api/services';
import { getErrorMessage } from '../api/client';
import Alert from '../components/Alert';
import Loader from '../components/Loader';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend
);

// Warna diambil dari slot kategorikal yang sudah divalidasi keterbacaannya
// (termasuk untuk pengguna buta warna).
const SERIES_BLUE = '#2a78d6';
const STATUS_COLORS = ['#2a78d6', '#1baf7a', '#eb6834']; // dipinjam, dikembalikan, terlambat
const INK_MUTED = '#898781';
const GRID = '#e1e0d9';

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { padding: 10, boxPadding: 4 },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: INK_MUTED } },
    y: {
      beginAtZero: true,
      grid: { color: GRID, drawBorder: false },
      ticks: { color: INK_MUTED, precision: 0 },
    },
  },
};

const CARDS = [
  { key: 'totalBooks', label: 'Total Judul Buku', hint: 'judul terdaftar', icon: '📚' },
  { key: 'availableBooks', label: 'Eksemplar Tersedia', hint: 'siap dipinjam', icon: '✅' },
  { key: 'totalMembers', label: 'Total Anggota', hint: 'anggota terdaftar', icon: '👥' },
  { key: 'activeLoans', label: 'Sedang Dipinjam', hint: 'transaksi berjalan', icon: '🔄' },
];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    dashboardService
      .summary()
      .then((res) => {
        if (alive) setSummary(res.data);
      })
      .catch((err) => {
        if (alive) setError(getErrorMessage(err, 'Gagal memuat ringkasan dashboard.'));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <Loader label="Memuat ringkasan dashboard..." />;
  if (error) return <Alert message={error} />;
  if (!summary) return null;

  const { cards, charts, topBorrowedBooks } = summary;

  const categoryData = {
    labels: charts.booksByCategory.map((row) => row.category),
    datasets: [
      {
        label: 'Jumlah judul',
        data: charts.booksByCategory.map((row) => row.total),
        backgroundColor: SERIES_BLUE,
        borderRadius: 4,
        maxBarThickness: 34,
      },
    ],
  };

  const statusData = {
    labels: charts.loanStatus.map((row) => row.label),
    datasets: [
      {
        data: charts.loanStatus.map((row) => row.total),
        backgroundColor: STATUS_COLORS,
        borderColor: '#ffffff',
        borderWidth: 2, // celah tipis antar segmen agar batasnya terbaca
      },
    ],
  };

  const monthlyData = {
    labels: charts.loansPerMonth.map((row) => row.label),
    datasets: [
      {
        label: 'Peminjaman',
        data: charts.loansPerMonth.map((row) => row.total),
        borderColor: SERIES_BLUE,
        backgroundColor: 'rgba(42, 120, 214, 0.12)',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: SERIES_BLUE,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        fill: true,
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="stack">
      <section className="cards">
        {CARDS.map((card) => (
          <article key={card.key} className="card stat-card">
            <span className="stat-icon" aria-hidden="true">
              {card.icon}
            </span>
            <div>
              <p className="stat-label">{card.label}</p>
              <p className="stat-value">{cards[card.key]}</p>
              <p className="stat-hint">{card.hint}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="cards cards-sm">
        <article className="card mini-stat">
          <span>Total Eksemplar</span>
          <strong>{cards.totalStock}</strong>
        </article>
        <article className="card mini-stat">
          <span>Total Transaksi</span>
          <strong>{cards.totalLoans}</strong>
        </article>
        <article className="card mini-stat">
          <span>Sudah Dikembalikan</span>
          <strong>{cards.returnedLoans}</strong>
        </article>
        <article className={`card mini-stat${cards.overdueLoans > 0 ? ' danger' : ''}`}>
          <span>Terlambat</span>
          <strong>{cards.overdueLoans}</strong>
        </article>
      </section>

      <section className="chart-grid">
        <article className="card chart-card">
          <header className="card-header">
            <h2>Jumlah Judul Buku per Kategori</h2>
            <p>Sepuluh kategori dengan koleksi terbanyak</p>
          </header>
          <div className="chart-box">
            {charts.booksByCategory.length ? (
              <Bar data={categoryData} options={baseOptions} />
            ) : (
              <p className="empty">Belum ada data buku.</p>
            )}
          </div>
        </article>

        <article className="card chart-card">
          <header className="card-header">
            <h2>Status Peminjaman</h2>
            <p>Komposisi transaksi berdasarkan statusnya</p>
          </header>
          <div className="chart-box">
            {cards.totalLoans ? (
              <Doughnut
                data={statusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '58%',
                  plugins: { legend: { display: false }, tooltip: { padding: 10 } },
                }}
              />
            ) : (
              <p className="empty">Belum ada transaksi peminjaman.</p>
            )}
          </div>
          {/* Nilai ditulis eksplisit, jadi identitas segmen tidak bergantung pada warna saja. */}
          <ul className="legend">
            {charts.loanStatus.map((row, i) => (
              <li key={row.label}>
                <span className="legend-dot" style={{ background: STATUS_COLORS[i] }} />
                {row.label}
                <strong>{row.total}</strong>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="chart-grid chart-grid-wide">
        <article className="card chart-card">
          <header className="card-header">
            <h2>Peminjaman per Bulan</h2>
            <p>Enam bulan terakhir</p>
          </header>
          <div className="chart-box">
            <Line data={monthlyData} options={baseOptions} />
          </div>
        </article>

        <article className="card">
          <header className="card-header">
            <h2>Buku Paling Sering Dipinjam</h2>
            <p>Lima teratas sepanjang waktu</p>
          </header>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Kategori</th>
                  <th className="num">Dipinjam</th>
                </tr>
              </thead>
              <tbody>
                {topBorrowedBooks.length ? (
                  topBorrowedBooks.map((row) => (
                    <tr key={row.bookId}>
                      <td>
                        <strong>{row.title}</strong>
                        <small className="muted-block">{row.author}</small>
                      </td>
                      <td>
                        <span className="badge">{row.category}</span>
                      </td>
                      <td className="num">{row.total}x</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="empty">
                      Belum ada data peminjaman.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
