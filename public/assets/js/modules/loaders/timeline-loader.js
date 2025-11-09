import { db } from '../firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const renderTimeline = (sections) => {
    const timelineContainer = document.getElementById('timeline-container');
    if (!timelineContainer) return;

    timelineContainer.innerHTML = ''; // Clear placeholder
    const lang = localStorage.getItem('language') || 'tr';

    sections.forEach((section, index) => {
        const side = index % 2 === 0 ? 'left' : 'right';
        const sectionDiv = document.createElement('div');
        sectionDiv.className = `timeline-item ${side}`;
        sectionDiv.setAttribute('data-aos', `fade-${side === 'left' ? 'right' : 'left'}`);

        let eventsHtml = '';
        if (section.events && Array.isArray(section.events)) {
            section.events.forEach(event => {
                eventsHtml += `
                    <h3>${event[`title_${lang}`] || event.title_en}</h3>
                    <p>${event[`text_${lang}`] || event.text_en}</p>
                `;
            });
        }

        sectionDiv.innerHTML = `
            <div class="timeline-content">
                <h2>${section[`title_${lang}`] || section.title_en}</h2>
                ${eventsHtml}
            </div>
        `;
        timelineContainer.appendChild(sectionDiv);
    });
};

export async function displayTimeline() {
    try {
        const q = query(collection(db, "timeline"), orderBy("order"));
        const querySnapshot = await getDocs(q);
        const sections = querySnapshot.docs.map(doc => doc.data());
        renderTimeline(sections);
    } catch (error) {
        console.error("Error fetching timeline data: ", error);
        const timelineContainer = document.getElementById('timeline-container');
        if (timelineContainer) {
            timelineContainer.innerHTML = '<p class="text-red-500 text-center">Failed to load timeline. Check Firestore collection name is "timeline".</p>';
        }
    }
}
