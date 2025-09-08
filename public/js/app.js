const out = document.getElementById('out');
document.getElementById('timeBtn').addEventListener('click', async () => {
    console.log("/api/time")
    const res = await fetch('/api/time');
    out.textContent = JSON.stringify(await res.json(), null, 2);
});