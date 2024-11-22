document.getElementById("uscFile").addEventListener("change", handleFile);

function handleFile(event) {
    const file = event.target.files[0];
    const errorMessage = document.getElementById("error-message");
    const resultElement = document.getElementById("result");

    // 初期化
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

            // ノーツ解析
            const lanes = Array(12).fill(0); // 12区間 (-6~-5, -5~-4, ..., 5~6)
            const laneOffset = 6;
            let totalNotes = 0;

            // ノーツの重複を防ぐため、各ノーツがどの区間にかかるかを正確にカウント
            objects.forEach((obj) => {
                if (typeof obj.lane === "number" && typeof obj.size === "number") {
                    totalNotes++;
                    const lane = obj.lane;
                    const size = obj.size;

                    // ノーツの範囲の計算
                    const leftEdge = lane - size;    // 左端
                    const rightEdge = lane + size;   // 右端

                    // 各区間に対して、ノーツがかかっているかどうかを判定
                    for (let i = -6; i < 6; i++) { // 区間ごとにノーツを計算
                        const laneStart = i;
                        const laneEnd = i + 1;

                        // ノーツがその区間にかかっている場合のみカウント
                        if (!(rightEdge <= laneStart || leftEdge >= laneEnd)) {
                            lanes[i + laneOffset]++;
                        }
                    }
                }
            });

            if (totalNotes === 0) {
                throw new Error("ノーツが検出されませんでした。");
            }

            // 4つの区間 (-6~-3, -3~0, 0~3, 3~6) にまとめる
            const ranges = [0, 0, 0, 0];
            for (let i = 0; i < 12; i++) {
                if (i >= 0 && i < 3) ranges[0] += lanes[i];  // 左外
                if (i >= 3 && i < 6) ranges[1] += lanes[i];  // 左内
                if (i >= 6 && i < 9) ranges[2] += lanes[i];  // 右内
                if (i >= 9 && i < 12) ranges[3] += lanes[i]; // 右外
            }

            // 割合を計算して表示
            let totalCountedNotes = ranges.reduce((acc, count) => acc + count, 0);
            if (totalCountedNotes === 0) {
                throw new Error("カウントされたノーツ数が0です。");
            }

            // 新しいラベル名を適用
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
