import * as React from "react";
import { Bot, Brain, MessageCircleQuestion } from "lucide-react";
import { EMessageDataType, EMessageType, type IChatItem } from "@/types/chat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react"; // Import Loader2

export default function MessageList(props: {
  className?: string;
  messages: {
    text?: string; // Make text optional
    role: 'user' | 'agent' | 'assistant';
    end_of_segment?: boolean;
    group_timestamp?: number;
    group_id?: string;
    asr_request_id?: string;
    image_url?: string; // Add image_url
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

export function MessageItem(props: { data: { text?: string; role: 'user' | 'agent' | 'assistant'; end_of_segment?: boolean; group_timestamp?: number; group_id?: string; asr_request_id?: string; image_url?: string; } }) {
  const { data } = props;
  const [isLoading, setIsLoading] = React.useState(!!data.image_url); // Set loading to true if image_url exists

  React.useEffect(() => {
    if (data.image_url) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [data.image_url]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    // Optionally display an error message or fallback image
    console.error("Error loading image:", data.image_url);
  };

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
          {data.text && <p>{data.text}</p>}
          {data.image_url && (
            <div className="relative w-full mt-2 rounded-md bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center min-h-[100px] aspect-square">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-300 dark:bg-gray-600 animate-pulse  ">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-gray-400" />
                </div>
              )}
              <img
                src={data.image_url}
                alt="AI generated image"
                className={cn(
                  "rounded-md max-w-full h-auto object-contain",
                  isLoading ? "opacity-0" : "opacity-100",
                  "transition-opacity duration-300"
                )}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
