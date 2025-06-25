import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
dayjs.extend(isSameOrAfter);

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Calendar() {
  const [month, setMonth] = useState(dayjs().month());
  const [year, setYear] = useState(dayjs().year());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add event form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    date: "",
  });

  // Track user-added events separately for auto-removal
  const [userEvents, setUserEvents] = useState([]);

  useEffect(() => {
    fetch("/events.json")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Remove user events whose date is before today
  useEffect(() => {
    const today = dayjs().startOf("day");
    setUserEvents((prev) =>
      prev.filter(
        (event) =>
          event.date &&
          dayjs(event.date, "YYYY-MM-DD", true).isValid() &&
          dayjs(event.date, "YYYY-MM-DD").isSameOrAfter(today, "day")
      )
    );
  }, [month, year]); // re-run when month/year changes (or you can use a timer for real-time)

  const currentDate = dayjs(`${year}-${String(month + 1).padStart(2, "0")}-01`);
  const startOfMonth = currentDate.startOf("month");
  const daysInMonth = currentDate.daysInMonth();
  const startDay = startOfMonth.day();

  let calendarDays = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 0; i < daysInMonth; i++) {
    calendarDays.push(startOfMonth.add(i, "day"));
  }

  // Show events for the displayed month and day, regardless of year
  const getEventsForDate = (date) => {
    if (!date) return [];
    // Built-in events (from events.json) are shown every year
    const builtin = events.filter((event) => {
      const eventDate = dayjs(event.date, "YYYY-MM-DD");
      return (
        eventDate.date() === date.date() && eventDate.month() === date.month()
      );
    });
    // User events are only for the exact date
    const user = userEvents.filter((event) =>
      dayjs(event.date, "YYYY-MM-DD").isSame(date, "day")
    );
    return [...builtin, ...user];
  };

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  // Add event handlers
  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!form.title || !form.date) return;
    setUserEvents([
      ...userEvents,
      {
        title: form.title,
        date: form.date,
      },
    ]);
    setForm({ title: "", date: "" });
    setShowForm(false);
  };

  // Highlight today's date
  const today = dayjs();

  return (
    <div className="max-w-xl mx-auto mt-8 bg-white rounded-lg shadow-lg p-4">
      {/* Add Event Button and Form */}
      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
        >
          {showForm ? "Cancel" : "Add Event"}
        </button>
        <div className="text-2xl font-bold text-center flex-1">
          {currentDate.format("MMMM YYYY")}
        </div>
      </div>
      {showForm && (
        <form
          className="mb-4 p-3 border rounded bg-gray-50 flex flex-col gap-2"
          onSubmit={handleAddEvent}
        >
          <input
            name="title"
            value={form.title}
            onChange={handleFormChange}
            placeholder="Event Title"
            className="border rounded px-2 py-1"
            required
          />
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleFormChange}
            className="border rounded px-2 py-1"
            required
          />
          <button
            type="submit"
            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          >
            Add
          </button>
        </form>
      )}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
        >
          &lt; Prev
        </button>
        <button
          onClick={handleNextMonth}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
        >
          Next &gt;
        </button>
      </div>
      {loading ? (
        <div className="mb-4 text-center text-gray-500">Loading events...</div>
      ) : null}
      <div className="grid grid-cols-7 gap-1 text-center font-semibold mb-2">
        {weekDays.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date, index) => {
          const isToday =
            date &&
            date.date() === today.date() &&
            date.month() === today.month() &&
            date.year() === today.year();
          return (
            <div
              key={index}
              className={`border rounded-lg h-24 p-1 flex flex-col items-center justify-start relative bg-gray-50${
                isToday ? " bg-blue-200 border-blue-500" : ""
              }`}
            >
              <div className="text-sm font-bold mb-1">
                {date ? date.date() : ""}
              </div>
              <div className="flex flex-col gap-1 w-full">
                {getEventsForDate(date).map((event, idx) => (
                  <span
                    key={idx}
                    className="text-xs rounded px-1 py-0.5 text-white bg-blue-500"
                    title={event.title}
                  >
                    {event.title}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;
