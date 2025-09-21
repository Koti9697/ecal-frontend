// In src/components/common/Notification.tsx

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | '';
  onDismiss: () => void;
}

export function Notification({ message, type, onDismiss }: NotificationProps) {
    if (!message) return null;

    const baseClasses = "p-4 mb-4 rounded-md flex justify-between items-center";
    const typeClasses: { [key: string]: string } = {
        success: "bg-green-100 text-green-800",
        error: "bg-red-100 text-red-800",
    };

    return (
        <div className={`${baseClasses} ${typeClasses[type]}`}>
            <span>{message}</span>
            <button onClick={onDismiss} className="font-bold text-lg">&times;</button>
        </div>
    );
}