function searchMenu() {
    let input = document.getElementById("mealSearch").value.toLowerCase();
    let table = document.querySelector("table");
    let rows = table.getElementsByTagName("tr");
    for (let i = 1; i < rows.length; i++) {
        let cells = rows[i].getElementsByTagName("td");
        let rowMatch = false;
        for (let j = 0; j < cells.length; j++) {
            let cellText = cells[j].innerText;
            cells[j].innerHTML = cellText;
            if (cellText.toLowerCase().includes(input) && input !== "") {
                rowMatch = true;
                let regex = new RegExp(`(${input})`, "gi");
                cells[j].innerHTML = cellText.replace(regex, "<span class='highlight'>$1</span>");
            }
        }
        rows[i].style.display = rowMatch || input === "" ? "" : "none";
    }
}
document.addEventListener("DOMContentLoaded", function () {
    function highlightCurrentMeal() {
        let hour = new Date().getHours();
        let dayIndex = new Date().getDay();
        let colIndex;
        if (hour < 11) {
            colIndex = 1;
        } else if (hour < 16) {
            colIndex = 2; 
        } else {
            colIndex = 3; 
        }
        let rows = document.querySelectorAll("table tr");
        rows.forEach((row, index) => {
            if (index === dayIndex) {
                let cells = row.querySelectorAll("td");
                if (cells[colIndex]) {
                    cells[colIndex].classList.add("current-meal");
                }
            }
        });
    }
    highlightCurrentMeal();
});