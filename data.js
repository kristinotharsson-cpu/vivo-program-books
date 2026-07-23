// Vivo Program Book — sample content
// Recreated from Víkingur Ólafsson's "From Afar" recital program
// All text is editable in-page via contentEditable

window.PROGRAM_DATA = {
  cover: {
    eyebrow: "Vivo Performing Arts",
    title: "Víkingur Ólafsson",
    subtitle: "Piano",
    date: "FRI   MAR 20, 2026",
    time: "8PM",
    venue: "Symphony Hall",
    accent: "green",
    brush: "harmony",
    photoCaption: "Víkingur Ólafsson",
    calloutLabel: "A note from CEO of Vivo Performing Arts",
    calloutName: "Thor Steingraber",
    presentedBy: "The Klarman Family Foundation",
    footerSponsor: {
      name: "Steinway & Sons",
      line: "Tonight's piano provided by Steinway & Sons. The instruments of choice for the world's greatest pianists.",
      href: "https://steinway.com"
    }
  },

  sections: [
    {
      id: "welcome",
      title: "Welcome",
      kind: "welcome",
      eyebrow: "From the Artistic Director",
      quote: "An evening of music heard twice — once in its first form, once again from afar.",
      body: [
        "Tonight we welcome one of the most singular voices in classical music to our stage. Víkingur Ólafsson's recitals are not concerts so much as essays in listening — careful, generous, and quietly radical.",
        "His program tonight, From Afar, was conceived during a long period of solitude. Each work appears twice in the evening: first on a Steinway, and later on an upright piano voiced with felt. The same notes. A different distance.",
        "Stay with us. Listen with him. And after the music ends, please join us in the lobby for a glass of something."
      ],
      signature: { name: "Mira Adachi", role: "Artistic Director, Vivo Performing Arts" }
    },
    {
      id: "performance-sponsor",
      title: "Performance Sponsor",
      kind: "performance-sponsor",
      eyebrow: "Tonight's Performance",
      lead: "Celebrity Series of Boston is grateful to the supporters whose generosity makes tonight's performance possible.",
      blocks: [
        {
          label: "Performance Supporter",
          name: "Susan & Michael Thonis",
          statement: "This performance is generously supported by Susan & Michael Thonis."
        },
        {
          label: "Additional support provided by",
          name: "Jeremy Silverman & Mary Sutherland",
          statement: "Additional support for this performance is provided by Jeremy Silverman & Mary Sutherland."
        }
      ],
      seasonSponsorsLabel: "2024 / 25 Season Sponsors",
      seasonSponsors: "Crescendo Donor Advised Fund and Susan & Michael Thonis",
      publicSupport: "Celebrity Series of Boston is supported in part by the Mass Cultural Council, a state agency.",
      closing: "And to the many individuals, corporations, foundations, and government agencies whose support helps fulfill our mission and vision — thank you."
    },
    {
      id: "program",
      title: "Today's Program",
      kind: "program",
      eyebrow: "The Running Order",
      lead: "Twenty-two pieces in a single arc, performed without interval. The first half is heard on the Steinway concert grand; the second half is the same program in the same order, on a felt-covered upright.",
      pieces: [
        { composer: "J. S. Bach", work: "Christe, du Lamm Gottes, BWV 619", meta: "Arr. György Kurtág" },
        { composer: "Robert Schumann", work: "Study in Canonic Form, Op. 56 No. 1" },
        { composer: "J. S. Bach", work: "Adagio from Sonata for Solo Violin No. 3 in C major, BWV 1005", meta: "Arr. Víkingur Ólafsson" },
        { composer: "György Kurtág", work: "Harmonica (Hommage à Borsody László)", meta: "From Játékok, Book 3" },
        { composer: "Béla Bartók", work: "Three Hungarian Folksongs from the Csìk, Sz. 35a", movements: [
          "I. Rubato",
          "II. L'istesso tempo",
          "III. Poco vivo"
        ]},
        { composer: "Johannes Brahms", work: "Intermezzo in E major, Op. 116 No. 4" },
        { composer: "György Kurtág", work: "A Voice in the Distance", meta: "From Játékok, Book 5" },
        { composer: "Snorri Sigfús Birgisson", work: "Where Life and Death May Dwell", meta: "Icelandic folk song" },
        { composer: "J. S. Bach", work: "Trio Sonata No. 1, BWV 525: I. Allegro moderato", meta: "Transcr. György Kurtág" },
        { composer: "Sigvaldi Kaldalóns", work: "Ave María", meta: "Arr. Víkingur Ólafsson" },
        { composer: "György Kurtág", work: "Little Chorale", meta: "From Játékok, Book 1" },
        { composer: "W. A. Mozart", work: "Laudate Dominum", meta: "From Vesperae solennes de confessore, K. 339   Arr. Víkingur Ólafsson" },
        { composer: "György Kurtág", work: "Sleepily", meta: "From Játékok, Book 1" },
        { composer: "Robert Schumann", work: "Träumerei, from Kinderszenen Op. 15 No. 7" },
        { composer: "György Kurtág", work: "Flowers We Are", meta: "From Játékok, Book 7" },
        { composer: "Thomas Adès", work: "The Branch (Az Ág)", meta: "World premiere recording   written for Víkingur Ólafsson" },
        { composer: "György Kurtág", work: "Twittering", meta: "From Játékok, Book 1" },
        { composer: "Robert Schumann", work: "Vogel als Prophet, from Waldszenen Op. 82 No. 7" },
        { composer: "Johannes Brahms", work: "Intermezzo in E minor, Op. 116 No. 5" },
        { composer: "György Kurtág", work: "Scraps of a Colinda Melody — Faintly Recollected (Hommage à Farkas Ferenc)", meta: "From Játékok, Book 3" },
        { kind: "intermission" },
        { composer: "The Program in Reprise", work: "All twenty-two pieces in the same order, performed on the felt-covered upright piano.", meta: "—" },
        { composer: "Víkingur Ólafsson", work: "Encore to be announced from the stage.", meta: "" }
      ]
    },
    {
      id: "notes",
      title: "Program Notes",
      kind: "notes",
      eyebrow: "On Tonight's Music",
      lead: "From Afar began as a thank-you note. In September 2021, Víkingur Ólafsson met the ninety-six-year-old Hungarian composer György Kurtág at the Budapest Music Center. He went home, sat down to write, and could not find the words. A musical map formed instead — with Kurtág's own music as the compass.",
      sections: [
        {
          h: "A Title Borrowed from Kurtág",
          body: [
            "The title, From Afar, is borrowed from Kurtág's own miniature 'Aus der Ferne.' It names the program's central condition: music heard from a distance — across years, across rooms, across the felt of an upright piano.",
            "Ólafsson has called this his most personal program. 'It connects very deeply to my childhood,' he said when the recording was released, 'and it pays homage to one of my favourite composers of all time.' Throughout the evening you will hear closely knit canons, transcriptions, dedications, and distant echoes of nearly forgotten, ancient melodies."
          ]
        },
        {
          h: "The Two Pianos",
          body: [
            "Tonight you will see two pianos on stage. The first is a Steinway concert grand — the instrument we expect, with its full bloom of overtones and projecting tone. The second is an upright piano whose hammers have been threaded with felt, dampening every note into something muffled and close, as if the music were being played in another room and overheard.",
            "You will hear all twenty-two pieces twice. First on the grand. Then, after a brief pause to re-set the felt, the same pieces in the same order on the upright. The notes are identical. The distance is not."
          ]
        },
        {
          h: "Kurtág as Compass",
          body: [
            "Seven of the twenty-two pieces are by Kurtág — mostly tiny gems from his Játékok ('Games'), a series of short pieces he has been writing since the 1970s. They serve here as connective tissue. Each Kurtág miniature opens onto the next composer, the way a door opens onto a corridor.",
            "His arrangement of Bach's chorale 'Christe, du Lamm Gottes' begins the program. His remembrance of a Romanian carol — 'Scraps of a Colinda Melody, Faintly Recollected' — ends the spoken half before the upright reprise. In between, he keeps appearing in the role of a friend who introduces strangers and then steps quietly aside."
          ]
        },
        {
          h: "Memory and Childhood",
          body: [
            "Two pieces in the program reach back to Ólafsson's Iceland. Sigvaldi Kaldalóns's 'Ave María,' which Ólafsson played for an empty Harpa concert hall in Reykjavík during the BBC's lockdown broadcasts in 2020, returns here as a quiet centrepiece. Snorri Sigfús Birgisson's setting of the Icelandic folk song 'Where Life and Death May Dwell' precedes it.",
            "Bartók's three Hungarian folksongs from the Csìk region act as the program's other folk anchor — melodies he collected on field trips with Kodály, here distilled to a minute apiece. Schumann's 'Träumerei' and 'Vogel als Prophet,' Brahms's two Op. 116 intermezzi, a Mozart aria arrangement: each is small, each was loved early."
          ]
        },
        {
          h: "A New Adès",
          body: [
            "Thomas Adès composed 'The Branch (Az Ág)' for Víkingur Ólafsson, with this album in mind. It is a brief piece — less than two minutes — that hangs suspended somewhere between consolation and unease. You hear it once on the grand and once on the upright, and it sounds like two different pieces."
          ]
        },
        {
          h: "What to Listen For",
          body: [
            "This is a recital that rewards stillness. Phones off, eyes closed if you like. The pieces are short — most under three minutes — and they are not meant to be heard one at a time. Listen for the way the upright reprise reframes what the grand has just said.",
            "Please hold applause until the end of each half. The program is performed as a single arc."
          ]
        }
      ],
      author: { name: "Daniel Mendoza", role: "Program Annotator" }
    },
    {
      id: "synopsis",
      title: "Setting",
      kind: "synopsis",
      eyebrow: "About the Stage",
      lead: "Tonight's program is performed without scenery, narration, or interval projection. The stage holds only what the music requires.",
      sections: [
        { h: "The Instruments", body: ["A Steinway Model D concert grand piano sits at center stage. To its left, a smaller upright piano — a Yamaha U3 — has been prepared with felt strips between the hammers and strings. The felt is removed and replaced between performances; tonight's preparation was set this afternoon."] },
        { h: "Lighting", body: ["The hall is lit warmly throughout, with no blackout between movements. Please do not applaud between movements of the Schumann; the eight fantasies are performed as a single arc."] },
        { h: "Run Time", body: ["The concert runs approximately 1 hour 50 minutes, including a 20-minute intermission."] }
      ]
    },
    {
      id: "artist",
      title: "Cast & Creative",
      kind: "cast",
      eyebrow: "On Stage Tonight",
      groups: [
        {
          id: "cast",
          h: "The Performer",
          rows: [
            { role: "Piano", name: "Víkingur Ólafsson", blurb: "Icelandic pianist and exclusive Deutsche Grammophon artist, celebrated for his probing intelligence and unusually literary programming." }
          ]
        },
        {
          id: "creative",
          h: "Creative & Production",
          rows: [
            { role: "Lighting Design", name: "Halla Pétursdóttir" },
            { role: "Piano Technician — Steinway", name: "Marcus Vance" },
            { role: "Piano Technician — Felt Upright", name: "Sarah Chen" },
            { role: "Stage Manager", name: "Jonas Reyes" },
            { role: "Tour Production Manager", name: "Birgir Þorvaldsson" },
            { role: "Artist Management", name: "Konzertdirektion Schmid" }
          ]
        }
      ]
    },
    {
      id: "musicians",
      title: "Musicians",
      kind: "roster",
      eyebrow: "Vivo Resident Orchestra   Off Tonight",
      lead: "Tonight's recital is a solo program, but Vivo's Resident Orchestra — heard with us throughout the season — is listed below.",
      groups: [
        { h: "Violin I", players: ["Anna Lindström, concertmaster", "Pavel Horák", "Reiko Sato", "Sofía Vega", "Jules Dembélé", "Henrietta Voss", "Mei Lin Tan", "Oskar Bjørn"] },
        { h: "Violin II", players: ["Theo Mwangi, principal", "Dorothea Klein", "Lucia Marchetti", "Bram Janssen", "Yusuf Demir", "Ines Costa"] },
        { h: "Viola", players: ["Camille Roux, principal", "Daniel Park", "Maja Holst", "Rohan Bhatt", "Eira Williams"] },
        { h: "Cello", players: ["Andrés Quiroga, principal", "Lotte Visser", "Kenji Watanabe", "Sade Adeyemi", "Helga Sigurðardóttir"] },
        { h: "Double Bass", players: ["Bruno Salvador, principal", "Niamh O'Carroll", "Petar Marković"] },
        { h: "Flute", players: ["Hana Kim, principal", "Tomás Rivera"] },
        { h: "Oboe", players: ["Margot Allard, principal", "Devon Park"] },
        { h: "Clarinet", players: ["Esa Nurmi, principal", "Aïsha Boudreau"] },
        { h: "Bassoon", players: ["Magnus Olesen, principal", "Lior Stein"] },
        { h: "Horn", players: ["Frida Lehtinen, principal", "Kwame Owusu", "Ines Bauer", "Tomasz Wójcik"] },
        { h: "Trumpet", players: ["Rafa Mendes, principal", "Iris Yamamoto"] },
        { h: "Trombone", players: ["Davi Pereira, principal", "Erik Hansen"] },
        { h: "Timpani & Percussion", players: ["Yuki Mori, principal", "Soren Aalto", "Niko Vidović"] }
      ]
    },
    {
      id: "bios",
      title: "About the Artists",
      kind: "bios",
      eyebrow: "Tonight's Artist",
      bios: [
        {
          id: "vikingur-olafsson",
          name: "Víkingur Ólafsson",
          role: "Piano",
          initials: "VÓ",
          photoSrc: "",
          body: [
            "Icelandic pianist Víkingur Ólafsson has been called the new superstar of classical piano for his probing intelligence, his unusual programming, and his refusal to treat the keyboard as a finished instrument. He came to wide international attention with a Bach album in 2018, followed by recordings devoted to Debussy & Rameau, Mozart & His Contemporaries, From Afar, and the Goldberg Variations — collectively streamed more than 400 million times.",
            "His 2023–24 season was given over almost entirely to a single work: he performed Bach's Goldberg Variations in eighty-eight recitals across six continents. The present program, From Afar, was conceived as the natural counterweight — a mosaic of twenty-two short pieces, played twice, on two very different pianos.",
            "Born in Reykjavík in 1984 to two musician parents, Ólafsson studied at the Juilliard School with Jerome Lowenthal and Robert McDonald. He is the founder of Reykjavík Midsummer Music and Vinterfest in Sweden, and serves as Artistic Partner of the Iceland Symphony Orchestra. He records exclusively for Deutsche Grammophon."
          ]
        },
        {
          id: "gyorgy-kurtag",
          name: "György Kurtág",
          role: "Composer   In Tribute",
          initials: "GK",
          photoSrc: "",
          body: [
            "Tonight's program would not exist without György Kurtág, the Hungarian composer who, at ninety-six, became its compass. Born in 1926 in what is now Lugoj, Romania, Kurtág studied in Budapest with Pál Kadosa and Sándor Veress, then in Paris with Olivier Messiaen and Darius Milhaud.",
            "He is best known for Játékok ('Games'), a series of piano miniatures begun in 1973 and still ongoing — some lasting only seconds, each one a complete musical thought. Seven appear in tonight's program. They are not arranged here as a suite. They are placed, like punctuation, between the longer pieces.",
            "Ólafsson met Kurtág at the Budapest Music Center in 2021. The conversation — and the music — became this program."
          ]
        }
      ]
    },
    {
      id: "supporters",
      title: "Vivo Performing Arts Supporters",
      kind: "supporters-list",
      eyebrow: "With Gratitude",
      supporters: {
            "categories": [
                  {
                        "id": "annual-fund",
                        "title": "Annual Fund",
                        "accent": "magenta",
                        "brush": "rhythm",
                        "tiers": [
                              {
                                    "amount": "$100,000+",
                                    "label": "Leadership Circle",
                                    "donors": [
                                          "The Hartwell Family Foundation",
                                          "Anonymous",
                                          "Eleanor & James Whitfield",
                                          "The Sato Endowment for the Arts"
                                    ]
                              },
                              {
                                    "amount": "$50,000–$99,999",
                                    "label": "Conductor's Circle",
                                    "donors": [
                                          "Adelaide Brennan",
                                          "Cyrus & Maya Patel",
                                          "The Garrison Family",
                                          "Marisol & Theo Reyes",
                                          "Walter & Inga Brandt",
                                          "The Lindgren Trust",
                                          "Nora Achebe-Hill"
                                    ]
                              },
                              {
                                    "amount": "$25,000–$49,999",
                                    "label": "Composer's Circle",
                                    "donors": [
                                          "Bea & Daniel Ostrov",
                                          "The Hyland Group",
                                          "Frederica Marsh",
                                          "Jamil & Lara Khan",
                                          "Birgitte Aaron",
                                          "Owen & Suzanne Kelley",
                                          "Iris Ferraro Charitable Fund",
                                          "The MacGregor Family",
                                          "Paolo & Yumi Tagliatti",
                                          "Vesna Petrović"
                                    ]
                              },
                              {
                                    "amount": "$10,000–$24,999",
                                    "label": "Soloist's Circle",
                                    "donors": [
                                          "Aaron Levy",
                                          "Adriana & Marc Boudreau",
                                          "Beatrice Onyango",
                                          "Calla Marshall",
                                          "Daniel & Holly Ferreira",
                                          "Edith Vance Trust",
                                          "Felipe Souza",
                                          "Greta Engelmann",
                                          "Henrik & Ulla Aas",
                                          "Imani Bridges",
                                          "Jasper Wong",
                                          "Kira Sundström",
                                          "Liam O'Donnell",
                                          "Marisa Drexler",
                                          "Nathaniel Park",
                                          "Olu Adesanya",
                                          "Priya Krishnamurti",
                                          "Quentin Larue",
                                          "Roxanne Pemberton",
                                          "Salvador Ortega",
                                          "Tanya Brennan",
                                          "Ursula Stein",
                                          "Vihaan Mehra"
                                    ]
                              },
                              {
                                    "amount": "$5,000–$9,999",
                                    "label": "Patron's Circle",
                                    "donors": [
                                          "Akira Tanaka",
                                          "Brigitte Voss",
                                          "Caleb Mwangi",
                                          "Daria Volkova",
                                          "Esme Holloway",
                                          "Fyodor Karpov",
                                          "Gemma Lascelles",
                                          "Hugo Bertrand",
                                          "Iyabo Adesina",
                                          "Joaquín Salas",
                                          "Kjell Lindqvist",
                                          "Linnea Søgaard",
                                          "Mateo Quintana",
                                          "Naia Rasmussen",
                                          "Olive Tremaine",
                                          "Petra Holovenko",
                                          "Quinn Aldercott",
                                          "Ruslana Bondar",
                                          "Sven Halldórsson",
                                          "Tariq Bashir",
                                          "Una Pávlovskaya",
                                          "Vito Barbieri",
                                          "Wren Eastwood",
                                          "Xiulan Cheng",
                                          "Yara Hassan",
                                          "Zane Kovac"
                                    ]
                              }
                        ]
                  }
            ],
            "footer": "Every effort has been made to ensure accuracy. To report an error, please contact the Advancement Office."
      }
    },
    {
      id: "staff-board",
      title: "Staff & Board",
      kind: "staff-board",
      eyebrow: "Vivo Performing Arts",
      staff: {
            "departments": [
                  {
                        "name": "Artistic Leadership",
                        "members": [
                              {
                                    "name": "Mira Adachi",
                                    "title": "Artistic Director"
                              },
                              {
                                    "name": "Lucien Foster",
                                    "title": "Music Director"
                              },
                              {
                                    "name": "Halla Pétursdóttir",
                                    "title": "Director of Production"
                              },
                              {
                                    "name": "Daniel Mendoza",
                                    "title": "Dramaturg & Annotator"
                              }
                        ]
                  },
                  {
                        "name": "Administration",
                        "members": [
                              {
                                    "name": "Priya Krishnamurti",
                                    "title": "Executive Director"
                              },
                              {
                                    "name": "Jonas Reyes",
                                    "title": "Director of Operations"
                              },
                              {
                                    "name": "Sade Adeyemi",
                                    "title": "Director of Development"
                              },
                              {
                                    "name": "Akira Tanaka",
                                    "title": "Director of Marketing"
                              },
                              {
                                    "name": "Liam O'Donnell",
                                    "title": "Director of Education"
                              },
                              {
                                    "name": "Iris Yamamoto",
                                    "title": "Finance Director"
                              }
                        ]
                  },
                  {
                        "name": "Production & Stage",
                        "members": [
                              {
                                    "name": "Halla Pétursdóttir",
                                    "title": "Production Director"
                              },
                              {
                                    "name": "Marcus Vance",
                                    "title": "Head Piano Technician"
                              },
                              {
                                    "name": "Sarah Chen",
                                    "title": "Piano Technician"
                              },
                              {
                                    "name": "Birgir Þorvaldsson",
                                    "title": "Stage Supervisor"
                              },
                              {
                                    "name": "Esme Holloway",
                                    "title": "House Manager"
                              }
                        ]
                  },
                  {
                        "name": "Education & Community",
                        "members": [
                              {
                                    "name": "Liam O'Donnell",
                                    "title": "Director"
                              },
                              {
                                    "name": "Caleb Mwangi",
                                    "title": "Schools Coordinator"
                              },
                              {
                                    "name": "Linnea Søgaard",
                                    "title": "Community Programs"
                              },
                              {
                                    "name": "Quinn Aldercott",
                                    "title": "Family Concerts"
                              }
                        ]
                  }
            ],
            "credits": []
      },
      boards: {
            "directors": [
                  {
                        "name": "Eleanor Whitfield",
                        "title": "Chair"
                  },
                  {
                        "name": "Cyrus Patel",
                        "title": "Vice Chair"
                  },
                  {
                        "name": "Marisol Reyes",
                        "title": "Treasurer"
                  },
                  {
                        "name": "Theo Reyes",
                        "title": "Secretary"
                  },
                  {
                        "name": "Adelaide Brennan"
                  },
                  {
                        "name": "James Whitfield"
                  },
                  {
                        "name": "Bea Ostrov"
                  },
                  {
                        "name": "Daniel Ostrov"
                  },
                  {
                        "name": "Frederica Marsh"
                  },
                  {
                        "name": "Jamil Khan"
                  },
                  {
                        "name": "The Honorable Inés Vargas"
                  },
                  {
                        "name": "Nora Achebe-Hill"
                  },
                  {
                        "name": "Owen Kelley"
                  },
                  {
                        "name": "Walter Brandt"
                  }
            ],
            "advisors": []
      }
    },
    {
      id: "upcoming",
      title: "Next at Vivo",
      kind: "events",
      eyebrow: "Coming Up at Vivo Performing Arts",
      lead: "Subscribe to the season at vivoperformingarts.org and never miss a night.",
      auto: true,
      count: 6
    },
    {
      id: "student-tickets",
      title: "Student Tickets",
      kind: "promo",
      layout: "row",
      eyebrow: "35 & Under",
      heading: "$20 Student Tickets",
      body: "Every performance this season is just $20 — bring the whole crew.",
      buttonLabel: "Get Tickets",
      buttonUrl: "https://www.vivoperformingarts.org/",
      buttonColor: "green",
      imageSrc: ""
    },
    {
      id: "sponsors",
      title: "Sponsors",
      kind: "sponsors",
      eyebrow: "Tonight's Recital is Presented With",
      ads: [
        { eyebrow: "Season Sponsor", name: "Lindgren & Co.", tagline: "Banking, since 1881.", url: "lindgren.com" },
        { eyebrow: "Recital Sponsor", name: "Steinway & Sons", tagline: "The instruments of choice for the world's greatest pianists.", url: "steinway.com" },
        { eyebrow: "Education Partner", name: "The Hartwell Foundation", tagline: "Music education in every school.", url: "hartwell.org" },
        { eyebrow: "Hospitality Partner", name: "Hotel Marquand", tagline: "Where the artists stay.", url: "hotelmarquand.com" }
      ]
    },
    {
      id: "info",
      title: "Hall Info",
      kind: "info",
      eyebrow: "Land Acknowledgment & Visitor Info",
      audienceInfo: [
        { id: "arrival", title: "Arrival & Seating", body: ["Doors open 45 minutes before curtain. Latecomers are seated at a suitable break in the music."] },
        { id: "coat-check", title: "Coat Check", body: ["Complimentary coat check is available in the main lobby, to the left of the box office."] },
        { id: "food-drink", title: "Food & Drink", body: ["The lobby bar opens one hour before the performance and during intermission. Drinks in spill-proof cups are welcome in the hall."] }
      ],
      sections: [
        { h: "Land Acknowledgment", body: ["Vivo Performing Arts gathers and performs on the unceded ancestral lands of the Massachusett, Pawtucket, and Wampanoag peoples. We acknowledge the original stewards of this land and recognize that the privilege of making music here carries a responsibility to honor, support, and listen to Indigenous communities — past, present, and future."] },
        { h: "Accessibility", body: ["Symphony Hall is fully wheelchair accessible. Assistive listening devices are available at the coat check at no charge. Large-print programs are available; please ask an usher. For ASL or audio description on selected performances, please contact access@vivoperformingarts.org at least one week in advance."] },
        { h: "Safety & Etiquette", body: ["Please silence all phones and watches before the performance begins. Photography and recording of any kind are not permitted. Latecomers will be seated at a suitable break in the music. In the event of an emergency, please follow the directions of ushers to the nearest exit — exits are located at the rear, both sides, and at the front of the orchestra level."] },
        { h: "Contact", body: ["Box Office   (617) 555-0140   tickets@vivoperformingarts.org   1 Symphony Place, Boston   vivoperformingarts.org"] }
      ]
    }
  ]
};
