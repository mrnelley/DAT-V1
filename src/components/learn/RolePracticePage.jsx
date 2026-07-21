const RolePracticePage = ({ programId }) => (
  <main
    style={{
      alignItems: 'center',
      background: '#202441',
      color: '#ffffff',
      display: 'flex',
      fontFamily: 'Arial, sans-serif',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '32px',
      textAlign: 'center',
    }}
  >
    <div>
      <h1>Practice route reached</h1>
      <p>{programId.toUpperCase()} practice route is rendering.</p>
    </div>
  </main>
);

export default RolePracticePage;
