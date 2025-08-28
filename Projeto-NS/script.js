document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("itemForm");
    const responseMsg = document.getElementById("responseMsg");
    const cardsSection = document.getElementById("cardsSection");
    const modal = document.getElementById("itemModal");
    const openBtn = document.getElementById("openModal");
    const closeBtn = modal.querySelector(".close");

    openBtn.addEventListener("click", () => modal.style.display = "block");
    closeBtn.addEventListener("click", () => modal.style.display = "none");
    window.addEventListener("click", e => { if(e.target === modal) modal.style.display = "none"; });

    async function loadItems() {
    const res = await fetch("/items");
    const items = await res.json();
    cardsSection.innerHTML = "";

    items.forEach((item, index) => {
        const card = document.createElement("div");
        card.classList.add("card");
        card.innerHTML = `
        <img src="${item.image}" alt="${item.name}" width="150">
        <h3>${item.name}</h3>
        <p>Preço: ${item.films}</p>
        <p>Quantidade: ${item.quantity}</p>
        <div class="card-buttons">
            <button class="edit-btn" data-index="${index}">Editar</button>
            <button class="delete-btn" data-index="${index}">Excluir</button>
        </div>
        `;
        cardsSection.appendChild(card);
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
        const idx = btn.dataset.index;
        const res = await fetch("/delete-item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ index: idx })
        });
        const result = await res.json();
        alert(result.message);
        loadItems();
        });
    });

    document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.addEventListener("click", () => {
        const idx = btn.dataset.index;
        const item = items[idx];
        document.getElementById("name").value = item.name;
        document.getElementById("films").value = item.films;
        document.getElementById("quantity").value = item.quantity;
        document.getElementById("saveDirectorBtn").textContent = "Atualizar";
        form.dataset.editIndex = idx;
        modal.style.display = "block";
        });
    });
    }

    form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const editIndex = form.dataset.editIndex;
    if (editIndex !== undefined) formData.append("index", editIndex);
    const url = editIndex !== undefined ? "/edit-item" : "/add-item";

    try {
        const res = await fetch(url, { method: "POST", body: formData });
        const result = await res.json();
        responseMsg.textContent = "✅ " + result.message;
        responseMsg.style.color = "green";
        form.reset();
        delete form.dataset.editIndex;
        document.getElementById("saveDirectorBtn").textContent = "Salvar";
        loadItems();
    } catch {
        responseMsg.textContent = "Erro ao salvar item.";
        responseMsg.style.color = "red";
    }
    });

    loadItems();
});
