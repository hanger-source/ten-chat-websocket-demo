import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/common/hooks";
import { setSelectedGraphId } from "@/store/reducers/global";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react"; // Import ExternalLink icon

export function RemoteGraphSelect() {
  const dispatch = useAppDispatch();
  const graphName = useAppSelector((state) => state.global.selectedGraphId);
  const graphs = useAppSelector((state) => state.global.graphList);
  const graphMap = useAppSelector((state) => state.global.graphMap); // Get graphMap
  const websocketConnectionState = useAppSelector((state) => state.global.websocketConnectionState);

  const selectedGraph = graphName ? graphMap[graphName] : null;

  const onGraphNameChange = (val: string) => {
    dispatch(setSelectedGraphId(val));
  };

  const graphOptions = graphs.map((item) => ({
    label: item.name,
    value: item.uuid,
  }));

  // console.log('RemoteGraphSelect: graphOptions', graphOptions);

  return (
    <div className="flex items-center space-x-2">
      <Select
        value={graphName}
        onValueChange={onGraphNameChange}
      >
        <SelectTrigger
          className={cn(
            "w-auto", // or "w-auto max-w-full" if you want to keep the existing defaults
          )}
        >
          <SelectValue placeholder={"选择模式"} />
        </SelectTrigger>
        <SelectContent>
          {graphOptions.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
