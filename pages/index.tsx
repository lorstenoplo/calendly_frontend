import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Calendar, momentLocalizer, Event, SlotInfo } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Navbar from "@/components/Navbar";

const API_URL = "http://localhost:5000/api";

const localizer = momentLocalizer(moment);

interface User {
  id: number;
  name: string;
}

interface Task {
  id: number;
  userId: number;
  title: string;
  start: string;
  end: string;
}

interface Availability {
  start: string;
  end: string;
}

const App: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [newTask, setNewTask] = useState<{
    title: string;
    start: string;
    end: string;
  }>({
    title: "",
    start: new Date().toISOString(),
    end: new Date().toISOString(),
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      axios
        .get(`${API_URL}/user`, { params: { id: storedUserId } })
        .then((response) => {
          if (response.data.user) {
            setUserId(Number(storedUserId));
            setName(response.data.user.name);
          } else {
            setShowModal(true);
          }
        });
    } else {
      setShowModal(true);
    }
  }, []);

  useEffect(() => {
    if (userId !== null) {
      fetchTasks();
    }
  }, [userId]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get<Task[]>(`${API_URL}/tasks`, {
        params: { userId },
      });
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleNameSubmit = async () => {
    try {
      const response = await axios.post<User>(`${API_URL}/users`, { name });
      setUserId(response.data.id);
      localStorage.setItem("userId", response.data.id.toString());
      setShowModal(false);
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  const handleTaskSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const response = await axios.post<Task>(`${API_URL}/tasks`, {
        userId,
        task: newTask,
      });
      setTasks([...tasks, response.data]);
      setNewTask({
        title: "",
        start: new Date().toISOString(),
        end: new Date().toISOString(),
      });
      setShowModal(false);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setNewTask({
      ...newTask,
      start: slotInfo.start.toISOString(),
      end: slotInfo.end.toISOString(),
    });
    setShowModal(true);
  };

  const handleSelectEvent = useCallback(
    (event: Event) => window.alert(event.title),
    []
  );

  const events: Event[] = tasks.map((task) => ({
    title: task.title,
    start: new Date(task.start),
    end: new Date(task.end),
  }));

  return (
    <div className="">
      {showModal && (
        <div className="z-[1000] h-screen w-screen fixed top-0 left-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            {userId ? (
              <>
                <h2>Add Task</h2>
                <form>
                  <input
                    type="text"
                    placeholder="Task title"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    className="border border-gray-400 p-2 w-full rounded-lg my-4"
                  />
                  <button
                    className={`bg-red-400 rounded-md hover:bg-red-500 p-2 text-white w-full`}
                    onClick={handleTaskSubmit}
                  >
                    Submit
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2>Enter Your Name</h2>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border border-gray-400 p-2 w-full rounded-lg my-4"
                />
                <button
                  className={`bg-red-400 rounded-md hover:bg-red-500 p-2 text-white w-full`}
                  onClick={handleNameSubmit}
                >
                  Submit
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* <h1>Welcome {name}</h1> */}
      <Navbar />

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectSlot={handleSelectSlot}
        style={{ height: 500 }}
        onSelectEvent={handleSelectEvent}
      />
    </div>
  );
};

export default App;
