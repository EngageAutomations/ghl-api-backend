import React from 'react';
import { AlertTriangle, Users, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ConflictData {
  conflict: boolean;
  theirs: {
    enhancementConfig: Record<string, any>;
    updatedAt: string;
    updatedBy?: string;
  };
  yours: {
    enhancementConfig: Record<string, any>;
    lastModified: string;
  };
}

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflictData: ConflictData;
  onResolve: (resolution: 'merge' | 'override' | 'cancel') => void;
  isResolving?: boolean;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  isOpen,
  onClose,
  conflictData,
  onResolve,
  isResolving = false
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderConfigDiff = (theirConfig: Record<string, any>, yourConfig: Record<string, any>) => {
    const differences: { key: string; theirs: any; yours: any }[] = [];
    
    const compareObjects = (obj1: any, obj2: any, prefix = '') => {
      Object.keys({ ...obj1, ...obj2 }).forEach(key => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const val1 = obj1?.[key];
        const val2 = obj2?.[key];
        
        if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
          compareObjects(val1, val2, fullKey);
        } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
          differences.push({
            key: fullKey,
            theirs: val1,
            yours: val2
          });
        }
      });
    };
    
    compareObjects(theirConfig, yourConfig);
    return differences;
  };

  const differences = renderConfigDiff(conflictData.theirs.enhancementConfig, conflictData.yours.enhancementConfig);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Configuration Conflict Detected
          </DialogTitle>
          <DialogDescription>
            Another user has modified this location enhancement while you were working. 
            Please review the changes and choose how to resolve the conflict.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Conflict Summary */}
          <div className="flex gap-4">
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  Their Changes
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  {formatDate(conflictData.theirs.updatedAt)}
                  {conflictData.theirs.updatedBy && (
                    <Badge variant="secondary">{conflictData.theirs.updatedBy}</Badge>
                  )}
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  Your Changes
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  {formatDate(conflictData.yours.lastModified)}
                  <Badge variant="secondary">You</Badge>
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Differences */}
          {differences.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Configuration Differences</h3>
              {differences.map((diff, index) => (
                <Card key={index} className="border-l-4 border-l-amber-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-mono">{diff.key}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <Badge variant="destructive" className="mb-2">Their Value</Badge>
                      <pre className="text-xs bg-red-50 p-2 rounded border overflow-x-auto">
                        {JSON.stringify(diff.theirs, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <Badge variant="default" className="mb-2">Your Value</Badge>
                      <pre className="text-xs bg-blue-50 p-2 rounded border overflow-x-auto">
                        {JSON.stringify(diff.yours, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Resolution Options */}
          <Card className="bg-slate-50">
            <CardHeader>
              <CardTitle className="text-base">Resolution Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">Merge Changes</h4>
                <p className="text-sm text-muted-foreground">
                  Automatically combine both sets of changes where possible. Your changes will take precedence for conflicting values.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Override with Your Changes</h4>
                <p className="text-sm text-muted-foreground">
                  Discard their changes and save only your modifications.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Cancel</h4>
                <p className="text-sm text-muted-foreground">
                  Cancel your changes and reload the latest version from the server.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onResolve('cancel')}
            disabled={isResolving}
          >
            Cancel My Changes
          </Button>
          <Button
            variant="secondary"
            onClick={() => onResolve('merge')}
            disabled={isResolving}
          >
            Merge Changes
          </Button>
          <Button
            variant="default"
            onClick={() => onResolve('override')}
            disabled={isResolving}
          >
            Override with Mine
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};