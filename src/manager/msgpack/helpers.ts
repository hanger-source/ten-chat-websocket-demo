import { Location, Message } from "@/types/message";

export function locationToArray(location: Location): [string, string, string] {
    return [
        location.app_uri || "",
        location.graph_id || "",
        location.extension_name || ""
    ];
}

export function arrayToLocation(arr: [string, string, string]): Location {
    return {
        app_uri: arr[0],
        graph_id: arr[1],
        extension_name: arr[2]
    };
}

export function isMessage(input: unknown): input is Message {
    return (
        typeof input === 'object' &&
        input !== null &&
        'type' in input &&
        'id' in input &&
        'name' in input
    );
}
