import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { Calendar, momentLocalizer, SlotInfo, Event } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const API_URL = "http://localhost:5000/api";

const localizer = momentLocalizer(moment);

interface Availability {
  start: string;
  end: string;
}

interface User {
  id: number;
  name: string;
}

const Schedule: React.FC = () => {
  const router = useRouter();
  const { userId } = router.query;
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [recipientName, setRecipientName] = useState<string>("");
  const [appointmentMade, setAppointmentMade] = useState<boolean>(false);

  useEffect(() => {
    if (userId) {
      fetchAvailability();
    }
  }, [userId]);

  const fetchAvailability = async () => {
    try {
      const response = await axios.get<Availability[]>(
        `${API_URL}/availability`,
        {
          params: { userId },
        }
      );
      setAvailability(response.data);
    } catch (error) {
      console.error("Error fetching availability:", error);
    }
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setSelectedSlot(slotInfo);
  };

  const handleAppointmentSubmit = async () => {
    if (selectedSlot && recipientName) {
      try {
        const recipientId = await createUser();
        const appointment = {
          title: `Appointment with ${recipientName}`,
          start: selectedSlot.start.toISOString(),
          end: selectedSlot.end.toISOString(),
        };

        await axios
          .post(`${API_URL}/appointments`, {
            userId,
            recipientId,
            appointment,
          })
          .then((response) => {
            console.log(response.data);
          });

        setAppointmentMade(true);
      } catch (error) {
        console.error("Error creating appointment:", error);
      }
    }
  };

  const createUser = async () => {
    try {
      const response = await axios.post<User>(`${API_URL}/random-user`, {
        name,
      });
      localStorage.setItem("userId", response.data.id.toString());
      return response.data.id;
    } catch (error) {
      console.error("Error creating user:", error);
    }
    return null;
  };

  const availabilityEvents: Event[] = availability.map((slot, index) => ({
    title: "Available",
    start: new Date(slot.start),
    end: new Date(slot.end),
    allDay: false,
    resource: { type: "availability", id: index },
  }));

  return (
    <div className="schedule-page">
      <h1 className="font-semibold text-3xl text-center py-2 border border-b-2 mb-2">
        Schedule an Appointment
      </h1>
      <Calendar
        localizer={localizer}
        events={availabilityEvents}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectSlot={handleSelectSlot}
        style={{ height: 500 }}
      />
      {selectedSlot && (
        <div className="modal">
          <div className="modal-content flex flex-col p-4 w-1/2 space-y-3">
            <h2 className="font-semibold text-xl">Selected Slot</h2>
            <p>Start: {selectedSlot.start.toString()}</p>
            <p>End: {selectedSlot.end.toString()}</p>
            <input
              type="text"
              placeholder="Your name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="border border-gray-400 p-2 w-full rounded-lg my-4"
            />
            <div className="flex w-full space-x-2">
              <button
                className={`bg-gray-100 rounded-md hover:bg-gray-200 p-2 w-full`}
                onClick={() => setSelectedSlot(null)}
              >
                Cancel
              </button>

              <button
                className={`bg-blue-400 rounded-md hover:bg-blue-500 p-2 text-white w-full disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={handleAppointmentSubmit}
                disabled={!recipientName || appointmentMade}
              >
                Confirm Appointment
              </button>
            </div>
            {appointmentMade && (
              <p className="text-center font-medium">
                Appointment successfully made!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
