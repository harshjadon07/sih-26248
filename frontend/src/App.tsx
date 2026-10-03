import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './Login';
import { Shell } from './components/Shell';
import { Dashboard } from './Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Shell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="scenarios" element={<div>Scenarios</div>} />
          <Route path="instructor-room" element={<div>Instructor Control Room</div>} />
          <Route path="workspace" element={<div>Trainee Workspace</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
