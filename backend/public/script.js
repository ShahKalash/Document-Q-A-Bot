let conversationHistory = [];

function showLoading() {
    document.getElementById("loading-spinner").style.display = "block";
}

function hideLoading() {
    document.getElementById("loading-spinner").style.display = "none";
}

document.getElementById("pdf-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    showLoading();

    const formData = new FormData();
    formData.append("pdf", document.querySelector('[name="pdf"]').files[0]);

    const response = await fetch("/upload-pdf", {
        method: "POST",
        body: formData,
    });

    const result = await response.json();
    hideLoading();

    document.getElementById("summary").innerText = result.summary || "Error: " + result.error;
});

document.getElementById("ask-button").addEventListener("click", async () => {
    const question = document.getElementById("question").value;
    if (!question) {
        alert("Please enter a question.");
        return;
    }

    showLoading();

    const response = await fetch("/ask-question", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
    });

    const result = await response.json();
    hideLoading();

    const answer = result.answer || "No answer found.";
    conversationHistory.push({ question, answer });
    updateConversationLog();
    document.getElementById("question").value = "";
});

function updateConversationLog() {
    const conversationElement = document.getElementById("conversation");
    conversationElement.innerHTML = "";

    conversationHistory.forEach(({ question, answer }) => {
        const questionElement = document.createElement("p");
        questionElement.innerHTML = `<strong>Q:</strong> ${question}`;
        conversationElement.appendChild(questionElement);

        const answerElement = document.createElement("p");
        answerElement.innerHTML = `<strong>A:</strong> ${answer}`;
        conversationElement.appendChild(answerElement);
    });

    conversationElement.scrollTop = conversationElement.scrollHeight;
}
