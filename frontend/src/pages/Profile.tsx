import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../services/api";

interface ProfileData {
  name: string;
  email: string;
  role: string;
  profilePicture?: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [name, setName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getProfile();

        setProfile(data);
        setName(data.name || "");
        setProfilePicture(data.profilePicture || "");
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const updateData: {
        name?: string;
        profilePicture?: string;
        password?: string;
      } = {
        name: name.trim(),
        profilePicture: profilePicture.trim(),
      };

      if (password.trim()) {
        updateData.password = password;
      }

      const updatedProfile = await updateProfile(updateData);

      setProfile(updatedProfile);
      setName(updatedProfile.name || "");
      setProfilePicture(updatedProfile.profilePicture || "");
      setPassword("");

      setSuccess("Profile updated successfully.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <main className="page-container">
        <section className="details-card">
          <p>Loading profile...</p>
        </section>
      </main>
    );
  }

  if (error && !profile) {
    return (
      <main className="page-container">
        <section className="details-card">
          <p className="form-error">{error}</p>
        </section>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="page-container">
        <section className="details-card">
          <p className="progress-empty">Profile not found.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-container">
      <section className="page-header">
        <div>
          <h1>My Profile</h1>
          <p>View and update your account information.</p>
        </div>
      </section>

      <section className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {profilePicture ? (
              <img src={profilePicture} alt="Profile" />
            ) : (
              <span>{name.trim().charAt(0).toUpperCase() || "U"}</span>
            )}
          </div>

          <div>
            <h2>{profile.name}</h2>
            <p>{profile.email}</p>
          </div>
        </div>

        <div className="profile-account-info">
          <div>
            <span>Email</span>
            <strong>{profile.email}</strong>
          </div>

          <div>
            <span>Role</span>
            <strong className="profile-role">{profile.role}</strong>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
          className="profile-form"
        >
          <div className="form-group">
            <label htmlFor="profile-name">Name</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-email">Email</label>
            <input
              id="profile-email"
              type="email"
              value={profile.email}
              disabled
            />
            <small>Email cannot be changed here.</small>
          </div>

          <div className="form-group">
            <label htmlFor="profile-role">Role</label>
            <input
              id="profile-role"
              type="text"
              value={profile.role}
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-picture">Profile Picture URL</label>
            <input
              id="profile-picture"
              type="url"
              value={profilePicture}
              onChange={(event) => setProfilePicture(event.target.value)}
              placeholder="https://example.com/profile.jpg"
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-password">New Password</label>
            <input
              id="profile-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Leave blank to keep current password"
              minLength={6}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          {success && <p className="form-success">{success}</p>}

          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default Profile;
