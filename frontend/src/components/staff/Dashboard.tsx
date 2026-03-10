import React from 'react';

interface DashboardProps {
  data?: {
    overview?: {
      today_appointments: number;
      pending_appointments: number;
      active_therapists: number;
      total_therapists: number;
      total_treatments: number;
      total_users: number;
      total_patients: number;
    };
    today_appointments?: Array<{
      time: string;
      patient?: { name: string };
      treatment?: { name: string };
      status: string;
    }>;
    pending_appointments?: Array<{
      patient?: { name: string };
      treatment?: { name: string };
      date: string;
      time: string;
    }>;
  } | null;  // Allow null
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  // Handle null or undefined data
  if (!data) {
    return (
      <div className="dashboard">
        <h2>Dashboard Overview</h2>
        <div className="loading">Loading dashboard data...</div>
      </div>
    );
  }

  const stats = [
    { label: "Today's Appointments", value: data.overview?.today_appointments || 0, icon: '📅', color: '#4CAF50' },
    { label: 'Pending Requests', value: data.overview?.pending_appointments || 0, icon: '⏳', color: '#FF9800' },
    { label: 'Active Therapists', value: data.overview?.active_therapists || 0, icon: '👥', color: '#2196F3' },
    { label: 'Total Treatments', value: data.overview?.total_treatments || 0, icon: '💆', color: '#9C27B0' },
    { label: 'Total Patients', value: data.overview?.total_patients || 0, icon: '👤', color: '#E91E63' },
    { label: 'Total Users', value: data.overview?.total_users || 0, icon: '👥', color: '#607D8B' },
  ];

  return (
    <div className="dashboard">
      <h2>Dashboard Overview</h2>
      
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card" style={{ borderLeftColor: stat.color }}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-sections">
        <div className="section today-appointments">
          <h3>Today's Appointments</h3>
          {data.today_appointments && data.today_appointments.length > 0 ? (
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Treatment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.today_appointments.map((apt, idx) => (
                  <tr key={idx}>
                    <td>{apt.time}</td>
                    <td>{apt.patient?.name || 'N/A'}</td>
                    <td>{apt.treatment?.name || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${apt.status}`}>
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data">No appointments scheduled for today</p>
          )}
        </div>

        <div className="section pending-appointments">
          <h3>Pending Requests</h3>
          {data.pending_appointments && data.pending_appointments.length > 0 ? (
            <ul className="pending-list">
              {data.pending_appointments.map((apt, idx) => (
                <li key={idx} className="pending-item">
                  <div className="pending-info">
                    <span className="pending-patient">{apt.patient?.name}</span>
                    <span className="pending-treatment">{apt.treatment?.name}</span>
                    <span className="pending-datetime">{apt.date} at {apt.time}</span>
                  </div>
                  <div className="pending-actions">
                    <button className="btn-approve">✓</button>
                    <button className="btn-reject">✗</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">No pending requests</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;