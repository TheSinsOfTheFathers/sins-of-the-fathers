import { client } from '../../lib/sanityClient.js';

// Bu dosyada, başka bir kütüphaneye (Cytoscape gibi) ihtiyacımız yok.

const renderCharacterDetails = (character) => {
    const contentDiv = document.getElementById('character-detail-content');
    if (!contentDiv) {
        console.error('Content div not found!');
        return;
    }
    
    // Sayfa başlığını ve meta etiketlerini dinamik olarak güncelle.
    document.title = `${character.name} - The Sins of the Fathers`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', `Details about ${character.name}, ${character.title}. ${character.description || ''}`);
    }

    // İlişkiler (Relationships) HTML'ini oluştur.
    let relationshipsHtml = '';
    if (character.relationships && character.relationships.length > 0) {
        relationshipsHtml = character.relationships.map(rel => `
            <div class="relationship-card">
                <strong class="relationship-name">${rel.name}</strong>
                <span class="relationship-status">${rel.status}</span>
            </div>
        `).join('');
    } else {
        relationshipsHtml = '<p class="text-neutral-400">No known relationships.</p>';
    }

    // Bütün sayfanın ana HTML yapısını oluştur.
    contentDiv.innerHTML = `
        <div class="animate-fade-in">
            <!-- Üst Kısım: Resim ve Temel Bilgiler -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-start mb-12">
                <div class="md:col-span-1">
                    <img src="${character.image_url || 'https://placehold.co/600x400/1c1c1c/e0e0e0?text=No+Image'}" alt="${character.name}" class="w-full h-auto rounded-lg shadow-lg object-cover">
                </div>
                <div class="md:col-span-2">
                    <h1 class="text-5xl lg:text-6xl font-serif text-yellow-500 mb-2">${character.name}</h1>
                    <p class="text-xl text-neutral-400 italic mb-6">"${character.title}"</p>
                    <div class="prose prose-invert max-w-none text-neutral-300">
                        <p>${character.description || 'No description available.'}</p>
                    </div>
                </div>
            </div>
            
            <!-- Alt Kısım: Hikaye, İlişkiler ve Soy Ağacı -->
            <div classs="space-y-12">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    <div class="lg:col-span-2">
                        <h2 class="section-title">Story</h2>
                        <div class="prose prose-invert max-w-none text-neutral-300">
                            <p>${character.story || 'This character\'s story has not yet been written.'}</p>
                        </div>
                    </div>
                    <div class="lg:col-span-1">
                        <h2 class="section-title">Relationships</h2>
                        <div class="space-y-4">
                            ${relationshipsHtml}
                        </div>
                    </div>
                </div>

                <div>
                    <h2 class="section-title">Family Tree</h2>
                    <div class="mermaid-container">
                        <div class="mermaid">
                            <!-- Bu div, aşağıdaki kod tarafından, soy ağacı metniyle doldurulacak -->
                        </div>
                    </div>
                </div>
            </div>

        </div>
    `;

    // --- AİLE AĞACINI OLUŞTURMA VE ÇİZDİRME ---
    const familyTreeContainer = document.querySelector('.mermaid');
    if (familyTreeContainer) {
        // O en son, en güçlü, sözdizimi düzeltilmiş Mermaid kodumuz.
        const mermaidCode = `
            graph TD;

            %% Stil Tanımlamaları
            classDef theFounder fill:#5a1d1d,stroke:#993a3a,stroke-width:3px,color:#fff;
            classDef theHeir fill:#ca8a04,stroke:#ffdc73,stroke-width:2px,color:#000;
            classDef theBetrayed fill:#2d3748,stroke:#4a5568,stroke-width:1px,color:#a0aec0;
            classDef theShadows fill:#1a202c,stroke:#4a5568,stroke-width:1px,color:#a0aec0;
            classDef theCatalyst fill:#276749,stroke:#48bb78,stroke-width:1px,color:#fff;
            classDef theLie fill:#4c51bf,stroke:#7f9cf5,stroke-width:1px,color:#fff;

            %% Oyuncular
            Gregor(":::theFounder\n**Gregor 'The Crow' Ballantine**\n*Kurucu*");
            Ewan(":::theBetrayed\nEwan Ballantine\n*Reddedilen Onur*");
            Ruaraidh(":::theHeir\nRuaraidh Ballantine\n*Kırık Kral*");
            Havi(":::theHeir\nHavi\n*Gölgedeki Varis*");
            Alessandro(":::theLie\nAlessandro\n*Yalanın Oğlu*");
            Elizabeth(":::theCatalyst\nElizabeth\n*İlk Çatlak*");
            Aurelia(":::theCatalyst\nAurelia\n*Son Çatlak*");
            Vito(":::theLie\nVito Cagliari\n*Sahte Baba*");
            Donan(":::theShadows\nDonan Ballantine\n*Gölgedeki Kardeş*");
            Eamon(":::theShadows\nEamon\n*İhanetin Fısıltısı*");
        
            %% İlişkiler
            Gregor ==> Ewan;
            Gregor ==> Donan;
            Ewan ==> Ruaraidh;
            
            linkStyle 0,1,2 stroke:#8b0000,stroke-width:2px;

            subgraph S1 [ ]
                Elizabeth -- "REDDEDİLDİ" --x Ruaraidh;
                Elizabeth -- "SONUÇ" --> Havi;
                Ruaraidh -. "BİLİNMEYEN OĞUL" .-> Havi;
            end

            subgraph S2 [ ]
                Aurelia -- "TUTKU" --- Ruaraidh;
                Aurelia -- "SONUÇ" --> Alessandro;
                Vito -- "YALAN" --x Alessandro;
            end
            
            subgraph S3 [İmparatorluk Bağları]
                Gregor -- "Acımasız Miras" --> Ruaraidh;
                Ewan -- "İhanet" --> Eamon;
            end

            style S1 fill:none,stroke:none;
            style S2 fill:none,stroke:none;
            style S3 fill:none,stroke:#4a5568,stroke-width:1px,stroke-dasharray: 5 5;

            linkStyle 5 stroke:#718096,stroke-width:1px,stroke-dasharray: 5 5; 
            linkStyle 8 stroke-width:1px,stroke-dasharray: 3 3;
        `;
    
        familyTreeContainer.textContent = mermaidCode;
        
        // Bu kod bloğu, sayfanın o anki "mermaid" diyagramını bulup,
        // onu, bir SVG görseline dönüştürmesini sağlar.
        try {
            mermaid.run();
        } catch (error) {
            console.error("Mermaid.js render error:", error);
        }
    }
};

export const loadCharacterDetails = async () => {
    const contentDiv = document.getElementById('character-detail-content');
    if (!contentDiv) return;

    const params = new URLSearchParams(window.location.search);
    const characterSlug = params.get('slug'); 

    if (!characterSlug) {
        contentDiv.innerHTML = '<p class="text-red-500 text-center">No character slug provided.</p>';
        return;
    }

    try {
        // Sanity'den görsel URL'ini de alacak şekilde sorguyu güncelledim.
        const query = `*[_type == "character" && slug.current == $slug][0]{..., "image_url": image.asset->url, relationships[]{..., character->{name, "slug": slug.current}}}`;
        const sanityParams = { slug: characterSlug };

        const character = await client.fetch(query, sanityParams);

        if (character) {
            renderCharacterDetails(character); 
        } else {
            contentDiv.innerHTML = `<p class="text-red-500 text-center">Character with slug '${characterSlug}' not found.</p>`;
        }
    } 
    catch (error) {
        console.error("Error fetching character details: ", error);
        contentDiv.innerHTML = '<p class="text-red-500 text-center">Failed to load character details.</p>';
    }
};