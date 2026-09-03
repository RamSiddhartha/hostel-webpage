const SUPABASE_URL = "https://bbgcltyuffpcikywmovd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiZ2NsdHl1ZmZwY2lreXdtb3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDM4NzQsImV4cCI6MjA5MDAxOTg3NH0.IkWn5MgvA8ct7Bjfiu9dGg573GrTkRNjjVTbRdulJUM"; 

const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

const buttons = document.querySelectorAll(".type");
const darkened = document.getElementById("darkened");
const form = document.getElementById("form");
const successScreen = document.getElementById("success-screen");
const loader = document.getElementById("loader");
const btnText = document.getElementById("btnText");
const resolvedCountDisplay = document.getElementById("resolved-count");

async function fetchInitialCount() {
    const { count, error } = await client
        .from('complaints')
        .select('*', { count: 'exact', head: true });
    
    if (!error) {
        resolvedCountDisplay.innerText = count || 0;
    } else {
        console.error("Error fetching count:", error);
        resolvedCountDisplay.innerText = "0";
    }
}


buttons.forEach(btn => {
    btn.addEventListener("click", () => {
        const type = btn.getAttribute("data-type");
        document.getElementById("formTitle").innerText = type + " Request";
        document.getElementById("type").value = type;
        darkened.style.display = "flex";
    });
});

document.getElementById("close-btn").addEventListener("click", () => { 
    darkened.style.display = "none"; 
});


form.addEventListener("submit", async (e) => {
    e.preventDefault();
    loader.style.display = "block";
    btnText.innerText = "Processing...";
    document.getElementById("submit-button").disabled = true;

    const room_number = document.getElementById("room").value;
    const description = document.getElementById("desc").value;
    const category = document.getElementById("type").value;

    try {
        const { error: insertError } = await client
            .from("complaints")
            .insert([{ room_number, description, category }]);
        
        if (insertError) throw insertError;

        const { data: workerData, error: workerError } = await client
            .from("workers")
            .select("name, phone_number")
            .eq("trade", category);

        if (workerError) throw workerError;

        let currentCount = parseInt(resolvedCountDisplay.innerText) || 0;
        resolvedCountDisplay.innerText = currentCount + 1;

        form.style.display = "none";
        successScreen.style.display = "block";

        const contactInfoDiv = document.getElementById("contact-info");
        if (workerData && workerData.length > 0) {
            contactInfoDiv.innerHTML = workerData
                .map(w => `<div style="font-size:0.9rem; margin-bottom:5px;">${w.name}: <span style="color:var(--secondary)">${w.phone_number}</span></div>`)
                .join('');
        } else {
            contactInfoDiv.innerText = "📞 Contacting Duty Manager...";
        }
        
        loadRecentActivity(); 

    } catch (err) {
        alert("Submission failed: " + err.message);
        console.error(err);
    } finally {
        loader.style.display = "none";
        btnText.innerText = "Submit Grievance";
        document.getElementById("submit-button").disabled = false;
    }
});

async function loadRecentActivity() {
    const list = document.getElementById("activity-list");
    const { data, error } = await client
        .from("complaints")
        .select("category, room_number")
        .order("created_at", { ascending: false })
        .limit(4);

    if (error) {
        console.error("Error loading activity:", error);
        return;
    }

    if (data && data.length > 0) {
        list.innerHTML = data.map(item => `
            <div class="activity-item" style="padding: 15px 0;">
                <p>
                    <span class="tag" style="background: var(--accent-bg); color: var(--primary); border:none;">
                        ${item.category}
                    </span> 
                    Room <strong>${item.room_number}</strong> logged
                </p>
            </div>
        `).join('');
    } else {
        list.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">No recent activity.</p>`;
    }
}

const closeBtn = document.getElementById("close-btn");

const closeModal = () => {
    darkened.style.display = "none";
    form.style.display = "block";
    successScreen.style.display = "none";
};

closeBtn.addEventListener("click", closeModal);

window.addEventListener("click", (e) => {
    if (e.target === darkened) {
        closeModal();
    }
});

async function loadRecentActivity() {
    const list = document.getElementById("activity-list");
    const { data, error } = await client
        .from("complaints")
        .select("category, room_number")
        .order("created_at", { ascending: false })
        .limit(4);

    if (error) return;

    if (data && data.length > 0) {
        list.innerHTML = data.map(item => `
            <div class="activity-item" style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                <p style="font-size: 0.9rem;">
                    <span class="tag" style="background: var(--accent-bg); color: var(--primary); border:none;">
                        ${item.category}
                    </span> 
                    Room <strong>${item.room_number}</strong> logged
                </p>
            </div>
        `).join('');
    }
}

fetchInitialCount();
loadRecentActivity();