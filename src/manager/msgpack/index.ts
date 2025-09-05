import { encode, decode, ExtensionCodec, ExtData } from '@msgpack/msgpack';
import {
    Message,
    Location,
    MessageType,
    DataMessage,
    AudioFrame,
    VideoFrame,
    Command,
    CommandType,
    StartGraphCommand,
    StopGraphCommand,
    CommandResult,
} from "@/types/message";
import { locationToArray, arrayToLocation, isMessage } from './helpers';

// TEN框架自定义MsgPack扩展类型码
const TEN_MSGPACK_EXT_TYPE_MSG = 1;

// 创建扩展编解码器
const extensionCodec = new ExtensionCodec();

extensionCodec.register({
    type: TEN_MSGPACK_EXT_TYPE_MSG,
    encode: (input: unknown): Uint8Array | null => {
        if (!isMessage(input)) {
            return null;
        }

        const packedArray: any[] = [];

        // 1. Message 核心字段 (顺序与后端 BaseMessagePackSerializer 保持一致)
        packedArray.push(input.type.toString()); // MessageType
        packedArray.push(input.id);
        packedArray.push(input.src_loc ? locationToArray(input.src_loc) : null); // Location 转换为数组
        packedArray.push(input.dest_locs ? input.dest_locs.map(loc => locationToArray(loc)) : []); // Location 列表转换为数组的数组
        packedArray.push(input.name);
        packedArray.push(input.timestamp);
        packedArray.push(input.properties || {}); // properties 可以直接作为 Map 处理

        // 2. 特定消息类型字段
        switch (input.type) {
            case MessageType.DATA:
                // DataMessage 假设除了基类字段外没有额外字段，需要后端确认
                const dataMsg = input as DataMessage;
                packedArray.push(dataMsg.data); // 如果有 data 字段，需要在这里添加
                break;
            case MessageType.AUDIO_FRAME:
                const audioFrame = input as AudioFrame;
                packedArray.push(audioFrame.frame_timestamp);
                packedArray.push(audioFrame.sample_rate);
                packedArray.push(audioFrame.bits_per_sample);
                packedArray.push(audioFrame.samples_per_channel || 0);
                packedArray.push(audioFrame.number_of_channel);
                packedArray.push(audioFrame.channel_layout || 0);
                packedArray.push(audioFrame.data_fmt); // 直接推入 AudioFrameDataFmt 枚举值
                packedArray.push(audioFrame.buf);
                packedArray.push(audioFrame.line_size || 0);
                packedArray.push(audioFrame.is_eof || false);
                break;
            case MessageType.VIDEO_FRAME:
                const videoFrame = input as VideoFrame;
                packedArray.push(videoFrame.pixel_fmt);
                packedArray.push(videoFrame.frame_timestamp);
                packedArray.push(videoFrame.width);
                packedArray.push(videoFrame.height);
                packedArray.push(videoFrame.is_eof || false);
                packedArray.push(videoFrame.data);
                break;
            case MessageType.CMD:
                const cmd = input as Command;
                packedArray.push(cmd.cmd_id);
                // GenericCommand 假设除了基类字段外没有额外字段，需要后端确认
                break;
            case MessageType.CMD_START_GRAPH:
                const startGraphCmd = input as StartGraphCommand;
                // cmd_id 是 Command 的字段，不作为 StartGraphCommand 的特有字段在这里序列化
                // long_running_mode, extension_groups_info, extensions_info 在后端没有被序列化
                packedArray.push(startGraphCmd.predefined_graph_name || null);
                packedArray.push(startGraphCmd.graph_json || null);
                break;
            case MessageType.CMD_STOP_GRAPH:
                const stopGraphCmd = input as StopGraphCommand;
                // cmd_id 是 Command 的字段，不作为 StopGraphCommand 的特有字段在这里序列化
                packedArray.push(stopGraphCmd.graph_id || null);
                break;
            case MessageType.CMD_RESULT:
                const cmdResult = input as CommandResult;
                // cmd_id 是 Command 的字段，不作为 CommandResult 的特有字段在这里序列化
                packedArray.push(cmdResult.original_cmd_id);
                packedArray.push(cmdResult.original_cmd_type);
                packedArray.push(cmdResult.original_cmd_name || "");
                packedArray.push(cmdResult.status_code);
                packedArray.push(cmdResult.is_final);
                packedArray.push(cmdResult.is_completed);
                break;
            default:
                // Log unknown message types for debugging
                console.warn(`MSGPACK_ENCODER_TRACE: Unknown MessageType for encoding: ${input.type}`);
                break;
        }

        return encode(packedArray);
    },

    decode: (data: Uint8Array): Message => {
        const unpackedArray = decode(data) as any[];

        // 1. Message 核心字段
        const type = unpackedArray[0] as MessageType;
        const id = unpackedArray[1] as string;
        const src_loc_array = unpackedArray[2] as [string, string, string] | null;
        const dest_locs_arrays = unpackedArray[3] as [string, string, string][];
        const name = unpackedArray[4] as string;
        const timestamp = unpackedArray[5] as number;
        const properties = unpackedArray[6] as Record<string, any>;

        const src_loc = src_loc_array ? arrayToLocation(src_loc_array) : undefined; // Convert to Location object
        const dest_locs = dest_locs_arrays ? dest_locs_arrays.map(arr => arrayToLocation(arr)) : []; // Convert to Location objects

        // 初始化通用 Message 字段
        let message: Message = {
            id,
            type,
            src_loc,
            dest_locs,
            name,
            timestamp,
            properties,
        };

        // 2. 特定消息类型字段
        // 保持与 encode 时的顺序一致
        let currentIdx = 7; // 从第 7 个索引开始是特定消息类型字段
        switch (type) {
            case MessageType.DATA:
                // DataMessage 假设除了基类字段外没有额外字段
                const data = unpackedArray[currentIdx++]; // 如果有 data 字段
                break;
            case MessageType.AUDIO_FRAME:
                (message as AudioFrame).frame_timestamp = unpackedArray[currentIdx++];
                (message as AudioFrame).sample_rate = unpackedArray[currentIdx++];
                (message as AudioFrame).bits_per_sample = unpackedArray[currentIdx++];
                (message as AudioFrame).samples_per_channel = unpackedArray[currentIdx++];
                (message as AudioFrame).number_of_channel = unpackedArray[currentIdx++];
                (message as AudioFrame).channel_layout = unpackedArray[currentIdx++];
                (message as AudioFrame).data_fmt = unpackedArray[currentIdx++]; // 直接接收 AudioFrameDataFmt 枚举值
                (message as AudioFrame).buf = unpackedArray[currentIdx++];
                (message as AudioFrame).line_size = unpackedArray[currentIdx++];
                (message as AudioFrame).is_eof = unpackedArray[currentIdx++];
                break;
            case MessageType.VIDEO_FRAME:
                (message as VideoFrame).pixel_fmt = unpackedArray[currentIdx++];
                (message as VideoFrame).frame_timestamp = unpackedArray[currentIdx++];
                (message as VideoFrame).width = unpackedArray[currentIdx++];
                (message as VideoFrame).height = unpackedArray[currentIdx++];
                (message as VideoFrame).is_eof = unpackedArray[currentIdx++];
                (message as VideoFrame).data = unpackedArray[currentIdx++];
                break;
            case MessageType.CMD:
                (message as Command).cmd_id = unpackedArray[currentIdx++];
                break;
            case MessageType.CMD_START_GRAPH:
                // cmd_id 是 Command 的字段，不作为 StartGraphCommand 的特有字段在这里反序列化
                // long_running_mode, extension_groups_info, extensions_info 在后端没有被反序列化
                (message as StartGraphCommand).predefined_graph_name = unpackedArray[currentIdx++];
                (message as StartGraphCommand).graph_json = unpackedArray[currentIdx++];
                break;
            case MessageType.CMD_STOP_GRAPH:
                // cmd_id 是 Command 的字段，不作为 StopGraphCommand 的特有字段在这里反序列化
                (message as StopGraphCommand).graph_id = unpackedArray[currentIdx++];
                break;
            case MessageType.CMD_RESULT:
                // cmd_id 是 Command 的字段，不作为 CommandResult 的特有字段在这里反序列化
                (message as CommandResult).original_cmd_id = unpackedArray[currentIdx++];
                (message as CommandResult).original_cmd_type = unpackedArray[currentIdx++];
                (message as CommandResult).original_cmd_name = unpackedArray[currentIdx++];
                (message as CommandResult).status_code = unpackedArray[currentIdx++];
                (message as CommandResult).is_final = unpackedArray[currentIdx++];
                (message as CommandResult).is_completed = unpackedArray[currentIdx++];
                break;
            default:
                console.warn(`MSGPACK_DECODER_TRACE: Unknown MessageType for decoding: ${type}`);
                break;
        }
        return message;
    },
});

// 导出 MessagePack 编解码函数
export function encodeMessage(message: Message): ArrayBuffer {
    const encoded = encode(message, { extensionCodec });
    // 返回底层 ArrayBuffer
    return encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength) as ArrayBuffer;
}

export function decodeMessage(data: ArrayBuffer): Message {
    try {
        const decoded = decode(new Uint8Array(data), { extensionCodec });
        return decoded as Message;
    } catch (error) {
        console.error('MSGPACK_DECODER_TRACE: MsgPack 解码错误:', error);
        if (error instanceof RangeError) {
            console.error('MSGPACK_DECODER_TRACE: RangeError: 数据可能被截断或格式不正确。');
        }
        throw error;
    }
}
