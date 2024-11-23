document.getElementById("uscFile").addEventListener("change", handleFile);

function handleFile(event) {
    const file = event.target.files[0];
    const errorMessage = document.getElementById("error-message");
    const resultElement = document.getElementById("result");
    
    errorMessage.textContent = "";
    resultElement.innerHTML = "";

    if (!file) {
        errorMessage.textContent = "ファイルを選択してください。";
        return;
    }

    const reader = new FileReader();
    reader.onload = function () {
        try {
            const data = JSON.parse(reader.result);
            const objects = data.usc?.objects || [];
            if (!Array.isArray(objects)) {
                throw new Error("USCファイルの形式が不正です。");
            }

            const lanes = Array(12).fill(0);
            const laneOffset = 6;
            let totalNotes = 0;

            objects.forEach((obj) => {
                if (typeof obj.lane === "number" && typeof obj.size === "number") {
                    totalNotes++;
                    const lane = obj.lane;
                    const size = obj.size;

                    const leftEdge = lane - size;
                    const rightEdge = lane + size;

                    for (let i = -6; i < 6; i++) {
                        const laneStart = i;
                        const laneEnd = i + 1;

                        if (!(rightEdge <= laneStart || leftEdge >= laneEnd)) {
                            lanes[i + laneOffset]++;
                        }
                    }
                }
            });

            if (totalNotes === 0) {
                throw new Error("ノーツが検出されませんでした。");
            }

            const ranges = [0, 0, 0, 0];
            for (let i = 0; i < 12; i++) {
                if (i >= 0 && i < 3) ranges[0] += lanes[i];
                if (i >= 3 && i < 6) ranges[1] += lanes[i];
                if (i >= 6 && i < 9) ranges[2] += lanes[i];
                if (i >= 9 && i < 12) ranges[3] += lanes[i];
            }

            let totalCountedNotes = ranges.reduce((acc, count) => acc + count, 0);
            if (totalCountedNotes === 0) {
                throw new Error("ノーツが置かれていない、もしくはレーン内にありません。");
            }

            const rangesLabels = ["左外", "左内", "右内", "右外"];

            ranges.forEach((count, index) => {
                const percentage = ((count / totalCountedNotes) * 100).toFixed(2);

                const row = document.createElement("tr");
                const laneCell = document.createElement("td");
                const percentageCell = document.createElement("td");

                laneCell.textContent = `${rangesLabels[index]}`;
                percentageCell.textContent = `${percentage}%`;

                row.appendChild(laneCell);
                row.appendChild(percentageCell);

                resultElement.appendChild(row);
            });
        } catch (error) {
            errorMessage.textContent = error.message;
        }
    };

    reader.onerror = function () {
        errorMessage.textContent = "ファイルの読み込みに失敗しました。";
    };

    reader.readAsText(file);
}
