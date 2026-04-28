import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <Sidebar />
      <Topbar />
      <div className="ml-64 pt-16">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
