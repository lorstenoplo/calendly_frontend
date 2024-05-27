import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Calendar, momentLocalizer, Event, SlotInfo } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Navbar from "@/components/Navbar";

const API_URL = "http://localhost:5000/api";

const localizer = momentLocalizer(moment);

interface User {
  _id: string;
  name: string;
}

interface Task {
  _id: number;
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
  const [password, setPassword] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
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
  const [showAvailabilityModal, setShowAvailabilityModal] =
    useState<boolean>(false);
  const [newAvailability, setNewAvailability] = useState<{
    start: string;
    end: string;
  }>({
    start: new Date().toISOString(),
    end: new Date().toISOString(),
  });
  const [appointmentLink, setAppointmentLink] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.get(`${API_URL}/me`, { params: { token } }).then((response) => {
        if (response.data.user) {
          setUserId(response.data.user._id);
          setName(response.data.user.username);
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
      fetchAvailability();
    }
  }, [userId]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get<Task[]>(`${API_URL}/tasks`, {
        params: { userId, token: localStorage.getItem("token") },
      });
      setTasks(response.data);
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await axios.get<Availability[]>(
        `${API_URL}/availability`,
        {
          params: { userId, token: localStorage.getItem("token") },
        }
      );
      setAvailability(response.data);
    } catch (error) {
      console.error("Error fetching availability:", error);
    }
  };

  const handleRegisterSubmit = async () => {
    try {
      const response = await axios.post<{ user: User; token: string }>(
        `${API_URL}/register`,
        {
          username: name,
          password,
        }
      );
      setUserId(response.data.user._id);
      // Using local storage due to time constraints (i know how to do it with cookies)
      localStorage.setItem("token", response.data.token.toString());
      setShowModal(false);
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  const handleLoginSubmit = async () => {
    try {
      const response = await axios.post<{ user: User; token: string }>(
        `${API_URL}/login`,
        {
          username: name,
          password,
        }
      );
      setUserId(response.data.user._id);
      localStorage.setItem("token", response.data.token.toString());
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
        token: localStorage.getItem("token"),
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

  const handleAvailabilitySubmit = async () => {
    try {
      const response = await axios.post<{
        userId: number;
        slots: Availability[];
      }>(`${API_URL}/availability`, {
        userId,
        slots: availability,
        token: localStorage.getItem("token"),
      });
      setAppointmentLink(`${window.location.origin}/schedule/${userId}`);
      setShowAvailabilityModal(false);
    } catch (error) {
      console.error("Error setting availability:", error);
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

  const handleSelectEvent = useCallback((event: Event) => {
    if (event.resource?.type === "availability") {
      handleSelectAvailabilitySlot(event as any);
    } else {
      window.alert(event.title);
    }
  }, []);

  const handleSelectAvailabilitySlot = (slotInfo: SlotInfo) => {
    setNewAvailability({
      start: slotInfo.start.toISOString(),
      end: slotInfo.end.toISOString(),
    });
    setAvailability([
      ...availability,
      {
        ...newAvailability,
        start: slotInfo.start.toISOString(),
        end: slotInfo.end.toISOString(),
      },
    ]);
    // setShowAvailabilityModal(false);
  };

  const events: Event[] = tasks.map((task) => ({
    title: task.title,
    start: new Date(task.start),
    end: new Date(task.end),
  }));

  const availabilityEvents: Event[] = availability.map((slot, index) => ({
    title: "Available",
    start: new Date(slot.start),
    end: new Date(slot.end),
    allDay: false,
    resource: { type: "availability", id: index },
  }));

  return (
    <div className="px-2">
      {showModal && (
        <div className="z-[1000] h-screen w-screen fixed top-0 left-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            {userId ? (
              <>
                <h2>Add Task</h2>
                <form onSubmit={handleTaskSubmit}>
                  <input
                    type="text"
                    placeholder="Task title"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    className="border border-gray-400 p-2 w-full rounded-lg my-4"
                    required
                  />
                  <div className="flex w-full space-x-2">
                    <button
                      type="button"
                      className={`bg-gray-100 rounded-md hover:bg-gray-200 p-2 w-full`}
                      onClick={() => setShowModal(false)}
                    >
                      Close
                    </button>

                    <button
                      type="submit"
                      className={`bg-blue-400 rounded-md hover:bg-blue-500 p-2 text-white w-full`}
                    >
                      Submit
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                {/* <h2 className="text-2xl font-semibold mb-3">Register Now!</h2> */}
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border border-gray-400 p-2 w-full rounded-lg my-2"
                />
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-gray-400 p-2 w-full rounded-lg my-2"
                />
                <div className="flex space-x-2 w-full">
                  <button
                    className={`mt-2 bg-gray-100 rounded-md hover:bg-gray-200 p-2 w-full`}
                    onClick={handleLoginSubmit}
                  >
                    Login
                  </button>
                  <button
                    className={`mt-2 bg-blue-400 rounded-md hover:bg-blue-500 p-2 text-white w-full`}
                    onClick={handleRegisterSubmit}
                  >
                    Register
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showAvailabilityModal && (
        <div className="modal z-[100]">
          <div className="modal-content">
            <Calendar
              localizer={localizer}
              events={availabilityEvents}
              startAccessor="start"
              endAccessor="end"
              selectable
              onSelectSlot={handleSelectAvailabilitySlot}
              style={{ height: 400 }}
            />
            <div className="flex w-full space-x-2 py-2">
              <button
                className="bg-gray-100 rounded-md hover:bg-gray-200 p-2 w-full mt-2"
                onClick={() => setShowAvailabilityModal(false)}
              >
                Close
              </button>
              <button
                className="bg-blue-400 rounded-md hover:bg-blue-500 p-2 text-white w-full mt-2"
                onClick={handleAvailabilitySubmit}
              >
                Set Availability
              </button>
            </div>
          </div>
        </div>
      )}

      {/* <h1>Welcome {name}</h1> */}
      <Navbar setShowAvailabilityModal={setShowAvailabilityModal} />

      {/* <button onClick={() => setShowAvailabilityModal(true)}>
          Set Availability
        </button> */}
      {appointmentLink && (
        <div className="flex space-x-2 py-3">
          <h2>Share this link to schedule an appointment:</h2>
          <a
            href={appointmentLink}
            className="text-blue-500 underline underline-offset-2"
          >
            {appointmentLink}
          </a>
        </div>
      )}

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
