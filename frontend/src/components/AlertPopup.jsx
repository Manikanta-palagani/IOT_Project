const AlertPopup = ({ alert, onClose, onItSMe, onConfirmAlert, resolvingStatus = '' }) => {
  if (!alert) {
    return null;
  }

  const zone = alert.zone || 'Main Entrance';
  const eventType = String(alert.eventType || alert.type || 'intrusion').toLowerCase();

  return (
    <div className="fixed top-5 right-5 z-50 w-96 pointer-events-auto animate-fade-in">
      <div className="relative rounded-2xl border bg-white p-5 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-lg"
          aria-label="Close alert popup"
        >
          ✕
        </button>

        <h2 className="text-lg font-bold text-gray-800 mb-2">Security Alert</h2>
        <p className="text-sm text-gray-700 mb-4">
          {eventType === 'intrusion'
            ? `🚨 Motion detected in ${zone}`
            : `🔥 Fire detected in ${zone}`}
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onItSMe}
            disabled={Boolean(resolvingStatus)}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg disabled:cursor-not-allowed disabled:opacity-70"
          >
            {resolvingStatus === 'secure' ? 'Updating...' : "It's Me"}
          </button>

          <button
            type="button"
            onClick={onConfirmAlert}
            disabled={Boolean(resolvingStatus)}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg disabled:cursor-not-allowed disabled:opacity-70"
          >
            {resolvingStatus === 'threat' ? 'Updating...' : 'Confirm Alert'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertPopup;