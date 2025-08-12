import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Users, ChevronRight, Plus } from "lucide-react";
import { RoomManager } from "@/components/RoomManager";
import { useRoom } from "@/contexts/RoomContext";

interface RoomSwitcherModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const RoomSwitcherModal = ({
  trigger,
  open,
  onOpenChange
}: RoomSwitcherModalProps) => {
  const { userRooms, currentRoom } = useRoom();

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Users className="w-4 h-4 mr-2" />
      {currentRoom?.name || 'Select Room'}
      <ChevronRight className="w-4 h-4 ml-2" />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-ping-pong" />
            Room Management
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6">
          {currentRoom && (
            <Card className="p-4 mb-6 bg-gradient-to-r from-ping-pong/5 to-table-green/5 border-ping-pong/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{currentRoom.name}</h3>
                  <p className="text-sm text-muted-foreground">Currently active room</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {currentRoom.players?.length || 0} players
                  </Badge>
                  <Badge className="bg-ping-pong">
                    Active
                  </Badge>
                </div>
              </div>
            </Card>
          )}

          <RoomManager />

          {userRooms.length === 0 && (
            <div className="text-center py-8">
              <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Rooms Available</h3>
              <p className="text-muted-foreground">Create your first room to get started with tournaments and MMR tracking.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};