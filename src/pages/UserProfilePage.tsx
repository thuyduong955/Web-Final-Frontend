import './UserProfilePage.css'

interface UserProfilePageProps {
  onBack?: () => void
}

const mockProfile = {
  name: 'Alex Nguyen',
  email: 'alex.nguyen@example.com',
  title: 'Product Designer',
  bio: 'Designs smooth interview experiences and obsesses over delightful flows.',
  location: 'Ho Chi Minh City, Vietnam',
  joined: 'February 2024',
  sessions: 38,
  streak: 5,
  gender: 'Female',
  dob: 'May 17, 1998',
  avatarUrl: '/src/assets/sidebar-avatar.png',
}

export function UserProfilePage({ onBack }: UserProfilePageProps) {
  return (
    <section className="profile" aria-labelledby="profile-heading">
      <header className="profile__header">
        <div>
          <p className="profile__eyebrow">Account</p>
          <h1 id="profile-heading">User profile</h1>
          <p className="profile__subtitle">Manage your identity, security, and activity insights.</p>
        </div>
        {onBack && (
          <button type="button" className="profile__back" onClick={onBack}>
            Back to lessons
          </button>
        )}
      </header>

      <div className="profile__grid">
        <article className="profile__card profile__card--info" aria-label="Basic information">
          <h2>Basic info</h2>
          <div className="profile__identity">
            <div className="profile__avatar-frame" aria-hidden="true">
              <img src={mockProfile.avatarUrl} alt="Profile avatar" />
            </div>
            <div>
              <p className="profile__identity-name">{mockProfile.name}</p>
              <p className="profile__identity-role">{mockProfile.title}</p>
            </div>
          </div>
          <dl>
            <div>
              <dt>Name</dt>
              <dd>{mockProfile.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{mockProfile.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{mockProfile.title}</dd>
            </div>
            <div>
              <dt>Gender</dt>
              <dd>{mockProfile.gender}</dd>
            </div>
            <div>
              <dt>Date of birth</dt>
              <dd>{mockProfile.dob}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{mockProfile.location}</dd>
            </div>
            <div>
              <dt>Joined</dt>
              <dd>{mockProfile.joined}</dd>
            </div>
          </dl>
          <div className="profile__bio-block">
            <h3>Bio</h3>
            <p className="profile__bio">{mockProfile.bio}</p>
          </div>
        </article>

        <article className="profile__card profile__card--activity" aria-label="Activity summary">
          <h2>Activity</h2>
          <ul className="profile__stats">
            <li>
              <p className="profile__stat-value">{mockProfile.sessions}</p>
              <p>Mock interviews completed</p>
            </li>
            <li>
              <p className="profile__stat-value">{mockProfile.streak} days</p>
              <p>Current streak</p>
            </li>
          </ul>
        </article>
      </div>

      <div className="profile__actions" role="group" aria-label="Profile actions">
        <button type="button" className="profile__button profile__button--primary">
          Update profile
        </button>
        <button type="button" className="profile__button profile__button--danger">
          Delete account
        </button>
      </div>
    </section>
  )
}

export default UserProfilePage
