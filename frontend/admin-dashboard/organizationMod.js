// import React, { useState, useEffect } from 'react';

// function AdminOrganizations() {
//     const [organizations, setOrganizations] = useState([]);
//     const [form, setForm] = useState({ name: '', description: '' });

//     useEffect(() => {
//         fetch('/organizations')
//             .then(res => res.json())
//             .then(setOrganizations);
//     }, []);

//     function handleChange(e) {
//         setForm({ ...form, [e.target.name]: e.target.value });
//     }

//     function handleCreate(e) {
//         e.preventDefault();
//         fetch('/organizations', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(form)
//         })
//         .then(res => res.json())
//         .then(org => setOrganizations([...organizations, org]));
//     }

//     function handleDelete(id) {
//         fetch(`/organizations/${id}`, { method: 'DELETE' })
//             .then(() => setOrganizations(organizations.filter(org => org.id !== id)));
//     }
// }


// return (
//     <div>
//         <h2>Organizations</h2>
//         <form onSubmit={handleCreate}>
//             <input
//                 name="name"
//                 value={form.name}
//                 onChange={handleChange}
//                 placeholder="Name"
//                 required
//             />
//             <input
//                 name="description"
//                 value={form.description}
//                 onChange={handleChange}
//                 placeholder="Description"
//             />
//             <button type="submit">Create</button>
//         </form>
//         <ul>
//             {organizations.map(org => (
//                 <li key={org.id}>
//                     {org.name} - {org.description}
//                     <button onClick={() => handleDelete(org.id)}>Delete</button>
//                 </li>
//             ))}
//         </ul>
//     </div>
// );


// export default AdminOrganizations;