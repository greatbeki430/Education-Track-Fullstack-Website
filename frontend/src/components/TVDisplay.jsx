import React, { useState, useEffect, useRef } from "react";
import api from "../api";
import "../styles/tvdisplay.css";

export default function TVDisplay() {
  const [announcements, setAnnouncements] = useState([]);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [isShowingAnnouncement, setIsShowingAnnouncement] = useState(false);
  const [nextCheckTime, setNextCheckTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDiningHours, setIsDiningHours] = useState(true);

  const announcementTimeoutRef = useRef(null);
  const cycleIntervalRef = useRef(null);
  const checkIntervalRef = useRef(null);

  // Dining hours: 5:00 PM to 8:00 PM Ethiopian time (17:00 - 20:00)
  const checkIfDiningHours = () => {
    const now = new Date();
    const hours = now.getHours();
    const isDining = hours >= 17 && hours <= 20; // 5 PM to 8 PM
    setIsDiningHours(isDining);
    return isDining;
  };

  // Fetch new announcements from server
  const fetchAnnouncements = async () => {
    try {
      const res = await api.get("/announcements");
      // Filter only active announcements (not expired, relevant for teachers)
      const activeAnnouncements = res.data.filter((a) => {
        // You can add expiration logic if needed
        return a.targetClass === "all" || a.targetClass === "teachers";
      });
      setAnnouncements(activeAnnouncements);
      setNextCheckTime(new Date(Date.now() + 30000)); // Next check in 30 seconds
    } catch (err) {
      console.error("Error fetching announcements:", err);
    }
  };

  // Show announcement overlay
  const showAnnouncement = (announcement) => {
    setIsShowingAnnouncement(true);

    // Auto-hide after 15 seconds
    if (announcementTimeoutRef.current) {
      clearTimeout(announcementTimeoutRef.current);
    }
    announcementTimeoutRef.current = setTimeout(() => {
      setIsShowingAnnouncement(false);
      // Move to next announcement or restart cycle
      setCurrentAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 15000); // Show for 15 seconds
  };

  // Main cycle: show announcements one by one
  const startAnnouncementCycle = () => {
    if (cycleIntervalRef.current) {
      clearInterval(cycleIntervalRef.current);
    }

    cycleIntervalRef.current = setInterval(() => {
      if (announcements.length > 0 && !isShowingAnnouncement && isDiningHours) {
        const announcement = announcements[currentAnnouncementIndex];
        if (announcement) {
          showAnnouncement(announcement);
        }
      }
    }, 30000); // Check every 30 seconds
  };

  // Regular content display (what plays between announcements)
  const RegularContent = () => {
    // This would normally be the regular TV content (news, videos, etc.)
    // In a real setup, you'd embed an iframe to the regular TV channel
    return (
      <div className="regular-content">
        <div className="tv-static-content">
          <h1>📺 Teachers' Lounge TV</h1>
          <div className="regular-program">
            {/* Embed regular TV channel or content here */}
            <div className="placeholder-content">
              <div className="time-display">
                {currentTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </div>
              <div className="date-display">
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div className="dining-info">
                <p>🍽️ Teachers' Dining Hall</p>
                <p>Lunch Hours: 5:00 PM - 8:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Announcement overlay component
  const AnnouncementOverlay = () => {
    const announcement = announcements[currentAnnouncementIndex];
    if (!announcement || !isShowingAnnouncement) return null;

    return (
      <div className="announcement-overlay">
        <div className="announcement-content">
          <div className="announcement-header">
            <span className="announcement-icon">📢</span>
            <span className="announcement-title">{announcement.title}</span>
            {announcement.pinned && <span className="pinned-badge">📌</span>}
          </div>
          <div className="announcement-body">
            <p className="announcement-text">{announcement.content}</p>
          </div>
          <div className="announcement-footer">
            <span className="announcement-time">
              Posted: {new Date(announcement.createdAt).toLocaleDateString()}
            </span>
            <span className="auto-close-timer">Closes in 15s</span>
          </div>
        </div>
      </div>
    );
  };

  // Countdown timer for next announcement
  const CountdownTimer = () => {
    const [secondsLeft, setSecondsLeft] = useState(30);

    useEffect(() => {
      const timer = setInterval(() => {
        setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 30));
      }, 1000);
      return () => clearInterval(timer);
    }, []);

    return (
      <div className="countdown-timer">
        Next announcement in: {secondsLeft}s
      </div>
    );
  };

  // Update current time every second
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
      checkIfDiningHours();
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // Fetch announcements periodically
  useEffect(() => {
    fetchAnnouncements();
    const fetchInterval = setInterval(() => {
      if (isDiningHours) {
        fetchAnnouncements();
      }
    }, 60000); // Check for new announcements every minute

    return () => clearInterval(fetchInterval);
  }, []);

  // Start announcement cycle when announcements change
  useEffect(() => {
    if (announcements.length > 0) {
      startAnnouncementCycle();
    }
    return () => {
      if (cycleIntervalRef.current) clearInterval(cycleIntervalRef.current);
      if (announcementTimeoutRef.current)
        clearTimeout(announcementTimeoutRef.current);
    };
  }, [announcements, currentAnnouncementIndex, isShowingAnnouncement]);

  // If not dining hours, show off-hours message
  if (!isDiningHours) {
    return (
      <div className="off-hours-screen">
        <div className="off-hours-content">
          <h1>📺 Teachers' Lounge TV</h1>
          <p>Next announcement cycle begins at 5:00 PM</p>
          <p>🍽️ Dining Hours: 5:00 PM - 8:00 PM</p>
          <div className="clock-display">
            {currentTime.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tv-display-container">
      {/* Regular TV Content */}
      <RegularContent />

      {/* Announcement Overlay */}
      <AnnouncementOverlay />

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          <span>🎓 Meskerem Secondary School</span>
          <span>📍 Teachers' Dining Hall</span>
        </div>
        <div className="status-center">
          <CountdownTimer />
        </div>
        <div className="status-right">
          <span>
            {currentTime.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span>📢 {announcements.length} active</span>
        </div>
      </div>
    </div>
  );
}
