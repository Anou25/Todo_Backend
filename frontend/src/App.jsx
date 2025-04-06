import Dashboard from "./Components/Dashboard";
import Login from "./Components/Login";
import Signup from "./Components/Signup";
import ProjectsComponent from "./Components/ProjectsComponent";
import ProjectDetails from "./Components/ProjectDetails";
import UserDashboard from "./Components/UserDashboard";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
function App() {
  const myRouter = createBrowserRouter([
    { path: '', element: <Signup /> },
     { path: 'login', element: <Login /> },
     { path: 'signup', element: <Signup /> },
     { path: 'dashboard', element: <Dashboard /> },
     { path: 'projects', element: <ProjectsComponent /> },
     { path: 'projects/:projectId', element: <ProjectDetails /> },
     { path: 'userDashboard', element: <UserDashboard /> },
   ]);

  return (
    <>
    <RouterProvider router = {myRouter}/>
    </>
  )
}

export default App
