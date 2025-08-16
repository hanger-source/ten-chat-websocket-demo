import * as React from "react";
import { Bot, Brain, MessageCircleQuestion } from "lucide-react";
import { EMessageDataType, EMessageType, type IChatItem } from "@/types/chat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function MessageList(props: {
  className?: string;
  messages: {
    text: string;
    role: 'user' | 'agent' | 'assistant';
  }[];
}) {
  const { className, messages } = props;

  return (
    <div
      className={cn("space-y-2", className)}
    >
      {messages.map((item, index) => {
        return <MessageItem data={item} key={index} />;
      })}
    </div>
  );
}

export function MessageItem(props: { data: { text: string; role: 'user' | 'agent' | 'assistant' } }) {
  const { data } = props;

  return (
    <>
      <div
        className={cn("flex items-start gap-2", {
          "flex-row-reverse": data.role === 'user',
        })}
      >
        {data.role === 'agent' || data.role === 'assistant' ? (
          <Avatar>
            <AvatarFallback>
              <Bot />
            </AvatarFallback>
          </Avatar>
        ) : null}
        <div
          className={cn("max-w-[80%] rounded-lg p-2", {
            "bg-secondary text-secondary-foreground": data.role === 'agent' || data.role === 'assistant',
            "bg-primary text-primary-foreground": data.role === 'user',
          })}
        >
          <p>{data.text}</p>
        </div>
      </div>
    </>
  );
}
