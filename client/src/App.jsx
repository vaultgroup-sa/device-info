import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import DeviceList from './pages/DeviceList.jsx';
import DeviceDetail from './pages/DeviceDetail.jsx';
import Footer from './components/Footer.jsx';

function NavTab({ to, children }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        fontSize: 14.5,
        fontWeight: 600,
        padding: '10px 20px',
        borderRadius: 999,
        background: isActive ? '#1c1b22' : 'transparent',
        color: isActive ? '#fff' : '#1c1b22',
      })}
    >
      {children}
    </NavLink>
  );
}

export default function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 56px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c07d' }} />
          <span className="heading" style={{ fontWeight: 700, fontSize: 18 }}>DeviceWatch</span>
        </div>
        <div style={{ display: 'flex', gap: 6, background: '#fff', border: '1px solid #e7e5ee', borderRadius: 999, padding: 4 }}>
          <NavTab to="/">Live Dashboard</NavTab>
          <NavTab to="/devices">All Devices</NavTab>
        </div>
      </nav>

      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/devices" element={<DeviceList />} />
          <Route path="/devices/:id" element={<DeviceDetail />} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}
