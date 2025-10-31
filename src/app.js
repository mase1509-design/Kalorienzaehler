import React, { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function Kalorienzaehler() {
  const [eintraege, setEintraege] = useState([]);
  const [kommentar, setKommentar] = useState("");
  const [kcal, setKcal] = useState("");
  const [kategorie, setKategorie] = useState("Frühstück");
  const chartRef = useRef();

  const heute = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const gespeicherte = JSON.parse(localStorage.getItem("kalorienEintraege")) || [];
    const gefiltert = gespeicherte.filter(
      (e) => new Date() - new Date(e.datum) < 7 * 24 * 60 * 60 * 1000
    );
    setEintraege(gefiltert);
    localStorage.setItem("kalorienEintraege", JSON.stringify(gefiltert));
  }, []);

  const speichern = () => {
    if (!kommentar || !kcal) return;
    const neuerEintrag = {
      datum: heute,
      kommentar,
      kcal: parseFloat(kcal),
      kategorie,
    };
    const neueListe = [...eintraege, neuerEintrag];
    setEintraege(neueListe);
    localStorage.setItem("kalorienEintraege", JSON.stringify(neueListe));
    setKommentar("");
    setKcal("");
  };

  const reset = () => {
    localStorage.removeItem("kalorienEintraege");
    setEintraege([]);
  };

  const gesamtProTag = eintraege.reduce((acc, e) => {
    acc[e.datum] = (acc[e.datum] || 0) + e.kcal;
    return acc;
  }, {});

  const kategorienSummen = ["Frühstück", "Mittagessen", "Abendessen", "Snacks"].map((kat) => ({
    name: kat,
    value: eintraege.filter((e) => e.kategorie === kat).reduce((sum, e) => sum + e.kcal, 0),
  }));

  const COLORS = ["#FFBB28", "#FF8042", "#00C49F", "#0088FE"];

  const exportPDF = async () => {
    const pdf = new jsPDF();
    pdf.text("Kalorienzähler Übersicht", 10, 10);
    const canvas = await html2canvas(chartRef.current);
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 10, 20, 180, 120);
    pdf.save("Kalorienübersicht.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-6">Kalorienzähler</h1>

      <div className="bg-white shadow-md rounded-2xl p-6 w-full max-w-md">
        <label className="block font-medium mb-2">Datum</label>
        <input type="text" value={heute} disabled className="w-full mb-4 p-2 border rounded-lg bg-gray-100" />

        <label className="block font-medium mb-2">Kommentar</label>
        <input
          type="text"
          value={kommentar}
          onChange={(e) => setKommentar(e.target.value)}
          className="w-full mb-4 p-2 border rounded-lg"
          placeholder="z. B. Apfel, Joghurt..."
        />

        <label className="block font-medium mb-2">KCAL</label>
        <input
          type="number"
          value={kcal}
          onChange={(e) => setKcal(e.target.value)}
          className="w-full mb-4 p-2 border rounded-lg"
          placeholder="z. B. 200"
        />

        <label className="block font-medium mb-2">Kategorie</label>
        <select
          value={kategorie}
          onChange={(e) => setKategorie(e.target.value)}
          className="w-full mb-4 p-2 border rounded-lg"
        >
          <option>Frühstück</option>
          <option>Mittagessen</option>
          <option>Abendessen</option>
          <option>Snacks</option>
        </select>

        <button
          onClick={speichern}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold w-full py-2 rounded-lg mb-3"
        >
          Speichern
        </button>

        <button
          onClick={reset}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold w-full py-2 rounded-lg"
        >
          Reset (nach 7 Tagen automatisch)
        </button>
      </div>

      <div className="mt-10 w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Übersicht</h2>
        <table className="w-full border-collapse border text-left">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Datum</th>
              <th className="border p-2">Gesamtkalorien</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(gesamtProTag).map(([datum, summe]) => (
              <tr key={datum}>
                <td className="border p-2">{datum}</td>
                <td className="border p-2">{summe}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div ref={chartRef} className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Verteilung nach Kategorie</h2>
        <PieChart width={300} height={300}>
          <Pie data={kategorienSummen} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
            {kategorienSummen.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>

      <button
        onClick={exportPDF}
        className="mt-6 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg"
      >
        Export als PDF
      </button>
    </div>
  );
}
