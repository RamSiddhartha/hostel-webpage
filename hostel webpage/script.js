window.onerror = function(msg, url, line) {
    alert("System Alert! A silent error occurred. Tell your dev:\n" + msg + "\nLine: " + line);
    return false;
};

document.addEventListener('DOMContentLoaded', () => {
    
    if (typeof window.supabase === 'undefined') {
        alert("CRITICAL ERROR: The Supabase library was blocked from loading. Your campus Wi-Fi or Adblocker is blocking 'cdn.jsdelivr.net'. Please turn off your adblocker or switch networks.");
        return; 
    }

    const supabaseUrl = 'https://bbgcltyuffpcikywmovd.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiZ2NsdHl1ZmZwY2lreXdtb3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDM4NzQsImV4cCI6MjA5MDAxOTg3NH0.IkWn5MgvA8ct7Bjfiu9dGg573GrTkRNjjVTbRdulJUM';
    
    const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    let myStudentId;
    try {
        myStudentId = localStorage.getItem('localStudentId');
        if (!myStudentId) {
            myStudentId = generateUUID();
            localStorage.setItem('localStudentId', myStudentId);
        }
    } catch (e) {
        myStudentId = generateUUID(); 
    }

    const floorSelect = document.getElementById('floorSelect');
    const defaultView = document.getElementById('defaultView');
    const floorView = document.getElementById('floorView');
    const floorTitle = document.getElementById('floorTitle');
    const blockA = document.getElementById('blockA');
    const blockB = document.getElementById('blockB');

    const myRoomInput = document.getElementById('myRoomInput');
    const setRoomBtn = document.getElementById('setRoomBtn');
    const currentUserDisplay = document.getElementById('currentUserDisplay');

    const shiftModal = document.getElementById('shiftModal');
    const modalMessage = document.getElementById('modalMessage');
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    let currentSupabaseRoomId = null;
    let pendingShiftData = null;

    function syncView() {
        const floor = floorSelect.value;
        if (floor === 'default') {
            defaultView.style.display = 'block';
            floorView.style.display = 'none';
        } else {
            defaultView.style.display = 'none';
            floorView.style.display = 'block';
            floorTitle.textContent = floor === "0" ? `Ground Floor Rooms` : `Floor ${floor} Rooms`;
            renderRooms(floor);
        }
    }
    
    syncView();
    floorSelect.addEventListener('change', syncView);

    setRoomBtn.addEventListener('click', async () => {
        const rawInput = myRoomInput.value.trim().toUpperCase();
        
        if (!rawInput) {
            alert("Please type a room number first!");
            return;
        }

        const cleanInput = rawInput.replace(/[^A-Z0-9]/g, ''); 
        let block, roomNum;
        
        if (cleanInput.length >= 4) {
            block = cleanInput[0];            
            roomNum = cleanInput.substring(1); 
        } else if (cleanInput.length === 3) {
            block = cleanInput[0];           
            roomNum = `${cleanInput[1]}0${cleanInput[2]}`; 
        } else {
            alert("Format not recognized. Please enter a format like A-101 or A-1-1.");
            return;
        }
        
        try {
            setRoomBtn.textContent = "Setting...";
            
            const { data: roomData, error: fetchError } = await supabaseClient
                .from('hostels')
                .select('*')
                .eq('block_name', block)
                .eq('room_number', roomNum)
                .single();

            if (fetchError || !roomData) {
                alert(`Room ${block}-${roomNum} not found in the database. Tell backend to check if it exists!`);
                setRoomBtn.textContent = "Set My Room";
                return;
            }

            const { error: rpcError } = await supabaseClient.rpc('handle_room_switch', {
                new_room_id: roomData.id,
                student_id: myStudentId
            });

            if (rpcError) {
                alert("Database blocked the shift: " + (rpcError.message || "Room might already be taken."));
                setRoomBtn.textContent = "Set My Room";
                return;
            }

            currentSupabaseRoomId = roomData.id;
            currentUserDisplay.innerHTML = `Your current room: <b>${roomData.block_name}-${roomData.room_number}</b>`;
            myRoomInput.value = '';
            setRoomBtn.textContent = "Set My Room";
            
            if (floorSelect.value !== 'default') renderRooms(floorSelect.value);
            
        } catch (err) {
            alert("Network Error: Could not reach the database. " + err.message);
            setRoomBtn.textContent = "Set My Room";
        }
    });

    async function renderRooms(floor) {
        blockA.innerHTML = '<p style="color:#64748b; font-weight:bold;">Loading Database...</p>';
        blockB.innerHTML = '<p style="color:#64748b; font-weight:bold;">Loading Database...</p>';

        try {
            const { data: rooms, error } = await supabaseClient
                .from('hostels')
                .select('*')
                .eq('floor_no', parseInt(floor))
                .order('room_number', { ascending: true });

            if (error) throw error;
            
            blockA.innerHTML = '';
            blockB.innerHTML = '';

            if (!rooms || rooms.length === 0) {
                blockA.innerHTML = '<p style="color:#ef4444;">No rooms generated for this floor yet.</p>';
                return;
            }

            const roomsA = rooms.filter(r => r.block_name === 'A');
            const roomsB = rooms.filter(r => r.block_name === 'B');

            const appendRoom = (room, container) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'room-wrapper';
                
                wrapper.setAttribute('data-room', room.room_number);

                const label = document.createElement('div');
                label.className = 'room-label';
                label.textContent = `${room.block_name}-${room.room_number}`;

                const roomDiv = document.createElement('div');
                roomDiv.className = `room ${room.is_occupied ? 'occupied' : 'vacant'}`;

                roomDiv.addEventListener('click', () => {
                    if (!room.is_occupied) {
                        if (!currentSupabaseRoomId) {
                            alert("Please enter and set your current room at the top before trying to shift.");
                            myRoomInput.focus();
                            return;
                        }
                        pendingShiftData = room;
                        modalMessage.innerHTML = `Are you sure you want to shift to<br><b>Room ${room.room_number}</b> in <b>Block ${room.block_name}</b>?`;
                        shiftModal.style.display = 'flex';
                    }
                });

                wrapper.appendChild(label);
                wrapper.appendChild(roomDiv);
                container.appendChild(wrapper);
            };

            roomsA.forEach(room => appendRoom(room, blockA));
            roomsB.forEach(room => appendRoom(room, blockB));
            
        } catch (err) {
            blockA.innerHTML = `<p style="color:#ef4444;">Error loading database: ${err.message}</p>`;
            blockB.innerHTML = '';
        }
    }

    confirmBtn.addEventListener('click', async () => {
        if (pendingShiftData && currentSupabaseRoomId) {
            confirmBtn.textContent = "Processing...";
            
            const { error: rpcError } = await supabaseClient.rpc('handle_room_switch', {
                new_room_id: pendingShiftData.id,
                student_id: myStudentId 
            });

            if (rpcError) {
                alert("Shift Failed: " + (rpcError.message || "Room might have just been taken."));
            } else {
                currentSupabaseRoomId = pendingShiftData.id;
                currentUserDisplay.innerHTML = `Your current room: <b>${pendingShiftData.block_name}-${pendingShiftData.room_number}</b>`;
            }

            confirmBtn.textContent = "Confirm Shift";
            shiftModal.style.display = 'none';
            pendingShiftData = null;
            renderRooms(floorSelect.value); 
        }
    });

    cancelBtn.addEventListener('click', () => {
        shiftModal.style.display = 'none';
        pendingShiftData = null;
    });

});