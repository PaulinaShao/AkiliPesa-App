
import CallHistoryList from "@/components/CallHistoryList";
import { Header } from "@/components/header";

export default function ProfileCallsPage() {
  return (
    <div className="dark">
        <Header isMuted={true} onToggleMute={() => {}}/>
        <div className="max-w-xl mx-auto p-4 pt-20">
            <h1 className="text-2xl font-bold mb-4">My Call History</h1>
            <CallHistoryList />
        </div>
    </div>
  );
}
