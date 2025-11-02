// React Components for Admin Dashboard - Organizations and Roles Management

function AdminOrganizations() {
    const [organizations, setOrganizations] = React.useState([]);
    const [form, setForm] = React.useState({ name: '', description: '' });
    const [message, setMessage] = React.useState('');

    React.useEffect(() => {
        fetch('http://localhost:3000/organizations')
            .then(res => res.json())
            .then(data => setOrganizations(data.organizations || []));
    }, []);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    function handleCreate(e) {
        e.preventDefault();
        fetch('http://localhost:3000/organizations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        })
        .then(res => res.json())
        .then(data => {
            if (data.organization) {
                setOrganizations([...organizations, data.organization]);
                setMessage('Organization created successfully!');
                setForm({ name: '', description: '' });
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Failed to create organization.');
            }
        })
        .catch(() => setMessage('Failed to create organization.'));
    }

    function handleDelete(name) {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
        fetch(`http://localhost:3000/organizations/${name}`, { method: 'DELETE' })
            .then(() => setOrganizations(organizations.filter(org => org.name !== name)));
    }

    return (
        <div style={{
            background: '#ffffff',
            padding: '28px 32px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
            <h2 style={{ marginTop: 0, color: '#5a4634', borderBottom: '2px solid #DECAB5', paddingBottom: '12px' }}>
                Manage Organizations
            </h2>

            {message && (
                <div style={{
                    background: message.includes('Failed') ? '#fee' : '#efe',
                    color: message.includes('Failed') ? '#c33' : '#383',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: `1px solid ${message.includes('Failed') ? '#fcc' : '#cfc'}`
                }}>
                    {message}
                </div>
            )}

            <div style={{
                background: '#F6F1EC',
                padding: '24px',
                borderRadius: '10px',
                marginBottom: '28px',
                border: '1px solid #DECAB5'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#5a4634', fontSize: '1.15em' }}>
                    Create New Organization
                </h3>
                <form onSubmit={handleCreate}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '20px',
                        marginBottom: '20px'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontWeight: '600', color: '#5a4634', fontSize: '0.95em' }}>
                                Organization Name *
                            </label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Enter organization name"
                                required
                                style={{
                                    padding: '12px 16px',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    fontSize: '1em',
                                    background: '#ffffff',
                                    transition: 'border-color 0.2s ease',
                                    outline: 'none'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#AA8E70'}
                                onBlur={(e) => e.target.style.borderColor = '#ddd'}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontWeight: '600', color: '#5a4634', fontSize: '0.95em' }}>
                                Description
                            </label>
                            <input
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Enter organization description (optional)"
                                style={{
                                    padding: '12px 16px',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    fontSize: '1em',
                                    background: '#ffffff',
                                    transition: 'border-color 0.2s ease',
                                    outline: 'none'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#AA8E70'}
                                onBlur={(e) => e.target.style.borderColor = '#ddd'}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={{
                            background: '#AA8E70',
                            color: '#ffffff',
                            padding: '12px 32px',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1em',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#8B7355'}
                        onMouseOut={(e) => e.target.style.background = '#AA8E70'}
                    >
                        Create Organization
                    </button>
                </form>
            </div>

            <div>
                <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#5a4634', fontSize: '1.15em' }}>
                    Existing Organizations ({organizations.length})
                </h3>
                {organizations.length === 0 ? (
                    <p style={{ color: '#999', fontStyle: 'italic', padding: '24px', textAlign: 'center', background: '#f9f9f9', borderRadius: '8px' }}>
                        No organizations created yet.
                    </p>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                        gap: '16px'
                    }}>
                        {organizations.map(org => (
                            <div
                                key={org.id}
                                style={{
                                    background: '#ffffff',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '10px',
                                    padding: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    minHeight: '120px'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.1)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{ flex: 1, marginBottom: '12px' }}>
                                    <div style={{
                                        fontSize: '1.2em',
                                        fontWeight: '700',
                                        color: '#5a4634',
                                        marginBottom: '8px'
                                    }}>
                                        {org.name}
                                    </div>
                                    {org.description && (
                                        <div style={{
                                            fontSize: '0.9em',
                                            color: '#666',
                                            lineHeight: '1.5',
                                            marginBottom: '8px'
                                        }}>
                                            {org.description}
                                        </div>
                                    )}
                                    {org.createdAt && (
                                        <div style={{
                                            fontSize: '0.8em',
                                            color: '#999',
                                            fontStyle: 'italic'
                                        }}>
                                            Created: {org.createdAt}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(org.name)}
                                    style={{
                                        background: '#dc3545',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.9em',
                                        fontWeight: '600',
                                        transition: 'background-color 0.2s ease',
                                        alignSelf: 'flex-end'
                                    }}
                                    onMouseOver={(e) => e.target.style.background = '#bb2d3b'}
                                    onMouseOut={(e) => e.target.style.background = '#dc3545'}
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function RoleManager() {
    const [userId, setUserId] = React.useState('');
    const [role, setRole] = React.useState('Student');
    const [message, setMessage] = React.useState('');
    const [messageType, setMessageType] = React.useState('');

    async function handleAssign() {
        if (!userId) {
            setMessageType('error');
            setMessage('Please enter a user ID.');
            return;
        }

        const res = await fetch('http://localhost:3000/roles/assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, newRole: role })
        });

        const data = await res.json();
        if (res.ok) {
            setMessageType('success');
            setMessage(data.message || 'Role assigned successfully!');
        } else {
            setMessageType('error');
            setMessage(data.error || 'Failed to assign role.');
        }

        setTimeout(() => setMessage(''), 5000);
    }

    async function handleRevoke() {
        if (!userId) {
            setMessageType('error');
            setMessage('Please enter a user ID.');
            return;
        }

        const res = await fetch(`http://localhost:3000/roles/revoke/${userId}?role=${role}`, {
            method: 'DELETE'
        });

        const data = await res.json();
        if (res.ok) {
            setMessageType('success');
            setMessage(data.message || 'Role revoked successfully!');
        } else {
            setMessageType('error');
            setMessage(data.error || 'Failed to revoke role.');
        }

        setTimeout(() => setMessage(''), 5000);
    }

    return (
        <div style={{
            background: '#ffffff',
            padding: '28px 32px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
            <h2 style={{ marginTop: 0, color: '#5a4634', borderBottom: '2px solid #DECAB5', paddingBottom: '12px' }}>
                Assign or Revoke Roles
            </h2>

            {message && (
                <div style={{
                    background: messageType === 'error' ? '#fee' : '#efe',
                    color: messageType === 'error' ? '#c33' : '#383',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: `1px solid ${messageType === 'error' ? '#fcc' : '#cfc'}`
                }}>
                    {message}
                </div>
            )}

            <div style={{
                background: '#F6F1EC',
                padding: '24px',
                borderRadius: '10px',
                border: '1px solid #DECAB5'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#5a4634', fontSize: '1.15em' }}>
                    User Role Management
                </h3>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '20px',
                    marginBottom: '24px'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontWeight: '600', color: '#5a4634', fontSize: '0.95em' }}>
                            User ID *
                        </label>
                        <input
                            type="number"
                            placeholder="Enter user ID"
                            value={userId}
                            onChange={e => setUserId(e.target.value)}
                            required
                            style={{
                                padding: '12px 16px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '1em',
                                background: '#ffffff',
                                transition: 'border-color 0.2s ease',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#AA8E70'}
                            onBlur={(e) => e.target.style.borderColor = '#ddd'}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontWeight: '600', color: '#5a4634', fontSize: '0.95em' }}>
                            Role *
                        </label>
                        <select
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            style={{
                                padding: '12px 16px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '1em',
                                background: '#ffffff',
                                transition: 'border-color 0.2s ease',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#AA8E70'}
                            onBlur={(e) => e.target.style.borderColor = '#ddd'}
                        >
                            <option value="Student">Student</option>
                            <option value="Organizer">Organizer</option>
                            <option value="Admin">Administrator</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                        onClick={handleAssign}
                        style={{
                            background: '#AA8E70',
                            color: '#ffffff',
                            padding: '12px 32px',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1em',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#8B7355'}
                        onMouseOut={(e) => e.target.style.background = '#AA8E70'}
                    >
                        Assign Role
                    </button>
                    <button
                        onClick={handleRevoke}
                        style={{
                            background: '#dc3545',
                            color: '#ffffff',
                            padding: '12px 32px',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1em',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#bb2d3b'}
                        onMouseOut={(e) => e.target.style.background = '#dc3545'}
                    >
                        Revoke Role
                    </button>
                </div>
            </div>
        </div>
    );
}
