import { AppProvider } from './context/AppContext';
import TopBar from './components/TopBar';
import LeftSidebar from './components/LeftSidebar';
import MapArea from './components/MapArea';
import Timeline from './components/Timeline';
import RightDrawer from './components/RightDrawer';
import Modal from './components/Modal';
import ConfirmDialog from './components/ConfirmDialog';

export default function App() {
  return (
    <AppProvider>
      <div className="h-screen flex flex-col overflow-hidden bg-parchment">
        <TopBar />
        <div className="flex-1 flex overflow-hidden relative">
          <LeftSidebar />
          <MapArea />
          <RightDrawer />
        </div>
        <Timeline />
        <Modal />
        <ConfirmDialog />
      </div>
    </AppProvider>
  );
}
