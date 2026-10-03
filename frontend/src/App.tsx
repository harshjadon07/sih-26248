import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './Login';
import { Shell } from './components/Shell';
import { Dashboard } from './Dashboard';
import { Scenarios } from './Scenarios';
import { Workspace } from './Workspace';
import { InstructorDashboard } from './InstructorDashboard';
import { ExerciseList } from './ExerciseList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Shell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="scenarios" element={<Scenarios />} />
          <Route path="exercises" element={<ExerciseList />} />
          <Route path="instructor-room" element={<InstructorDashboard />} />
          <Route path="workspace/:exerciseId" element={<Workspace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
