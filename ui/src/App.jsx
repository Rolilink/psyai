import './App.css';
import marieImgUrl from './assets/marie.png';
import useTalk from './useTalk';

const MarieUI = ({ handleOnClick, status}) => {
  return (
    <div className="flex items-center h-full justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-white text-3xl font-bold drop-shadow-md stroke-black">Marie</h1>
        <img src={marieImgUrl} alt="Marie's Avatar" className="mx-auto mb-4 max-w-xl" />
        <button
          onClick={handleOnClick}
          disabled={status === 'thinking' || status === 'talking'}
          className={
            `px-4 py-2 font-bold text-white rounded min-w-full ` +
            (status === 'default' || status === 'listening' ? 'bg-blue-500 hover:bg-blue-700' :
            status === 'thinking' ? 'bg-gray-400 cursor-not-allowed' :
            'bg-green-500 hover:bg-green-700 cursor-not-allowed')
          }
        >
          {status === 'default' && 'Talk'}
          {status === 'thinking' && 'Thinking...'}
          {status === 'talking' && 'Talking...'}
          {status === 'listening' && 'Stop Recording'}
        </button>
      </div>
    </div>
  );
};


function App() {
  const { recording, startRecording, stopRecording, status} = useTalk();
 
  // Handle button click based on recording state
  const handleButtonClick = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <MarieUI
      handleOnClick={handleButtonClick}
      status={status}
    />
  );
}

export default App;