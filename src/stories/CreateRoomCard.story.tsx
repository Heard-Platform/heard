import { CreateRoomCard } from "../components/CreateRoomCard";

export function CreateRoomCardStory() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <CreateRoomCard
        onCreateRoom={() => console.log("Create Room clicked")}
        onOpenExplorer={() => console.log("Open Explorer clicked")}
      />
    </div>
  );
}