export default function Loader({ label = 'Memuat data...' }) {
  return (
    <div className="loader">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
