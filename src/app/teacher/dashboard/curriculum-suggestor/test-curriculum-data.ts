export const mockCurriculumSuggestion = {
  id: "momentum-101-v1",
  lessonStructure: {
    title: "Momentum: The Physics of Impact",
    duration: "45 minutes",
    objectives: [
      "Define momentum and impulse.",
      "Apply the principle of conservation of momentum to solve collision problems.",
      "Differentiate between elastic and inelastic collisions.",
      "Relate momentum to real-world scenarios, particularly in Indian contexts.",
    ],
    phases: [
      {
        name: "Hook & Engagement",
        duration: "8 minutes",
        activities: [
          "Start with a short video clip (2 min) of a cricket ball hitting the bat forcefully (available on YouTube, search 'cricket bat hitting ball in slow motion'). Ask students: 'What makes the impact so powerful?'",
          "Quick brainstorming: What factors do you think contribute to the 'oomph' of a moving object? Encourage answers like speed and size.",
        ],
      },
      {
        name: "Core Content Delivery",
        duration: "25 minutes",
        activities: [
          "Introduce the concept of momentum as mass in motion (p=mv). Explain the units and vector nature of momentum.",
          "Discuss impulse (J = FΔt) and its relationship to momentum change (Impulse-Momentum Theorem).",
          "Explain the law of conservation of momentum, using examples of collisions.",
          "Differentiate between elastic and inelastic collisions, providing clear examples. Show visuals of billiard balls (elastic) vs. a clay ball hitting a wall (inelastic).",
        ],
      },
      {
        name: "Practice & Application",
        duration: "7 minutes",
        activities: [
          "Solve a simple numerical problem: A 2 kg object moving at 5 m/s collides head-on with a stationary 3 kg object. If they stick together, what is their final velocity? (Relate this to railway car coupling).",
          "Quick group discussion: How does the principle of momentum conservation apply in rocket propulsion (relevant to ISRO)?",
        ],
      },
      {
        name: "Wrap-up & Preview",
        duration: "5 minutes",
        activities: [
          "Summarize the key concepts of momentum, impulse, and conservation of momentum.",
          "Preview the next lecture: 'Collisions in 2D and Center of Mass'.",
          "Assign a short quiz on momentum for the next class (can be done online if resources are available).",
        ],
      },
    ],
  },
  experiment: {
    title: "Egg Drop Challenge: Protecting Momentum",
    duration: "7 minutes",
    materials: [
      "Raw eggs (1 per group of 4 students)",
      "Newspapers",
      "Plastic bags",
      "Straws",
      "Tape",
      "Other readily available recyclable materials",
    ],
    procedure: [
      "Divide the class into small groups.",
      "Challenge: Each group must design a container to protect an egg from breaking when dropped from a height of approximately 2 meters (e.g., dropping from a lab table).",
      "Students can use the provided materials to create their containers. Encourage creativity!",
      "Drop the eggs in their containers and observe the results.",
      "Discuss: Which designs were most successful? How did they reduce the impulse (force) on the egg? How did spreading the impact time (Δt) reduce the force?",
    ],
    expectedOutcome:
      "Students will understand that by increasing the impact time (Δt) using padding, the force experienced by the egg (and thus the momentum change) is reduced, preventing it from breaking. It illustrates impulse reduction in real life.",
  },
  openingRemarks: {
    curiosityQuestion:
      "If a truck and a bicycle are moving at the same speed, which one is harder to stop? Why?",
    curiosityAnswer:
      "The truck is much harder to stop because it has more mass. Even at the same speed, the truck has much greater momentum (p = mv). To stop it, you need to apply a larger force or apply force for a longer time (impulse = change in momentum). This is why trucks need longer stopping distances and stronger brakes.",
    funFact:
      "Did you know that the total momentum of the universe is believed to be conserved, even though individual objects are constantly colliding and exchanging momentum?",
    relatedStory:
      "Consider the 'Kabaddi' sport, popular in India. Players use momentum to tag opponents and escape. Successful raiders use their body weight and speed effectively to build momentum.",
    industryConnection:
      "Companies like Mahindra & Mahindra use the principles of momentum and impulse in designing safer vehicles. Crash tests analyze momentum transfer to improve passenger safety. Also relevant to material handling equipment design.",
  },
  postLectureResources: {
    readingMaterials: [
      {
        title: "Momentum and Impulse",
        type: "Article",
        difficulty: "Beginner",
        url: "https://www.khanacademy.org/science/physics/linear-momentum/momentum-tutorial/a/what-is-momentum",
      },
      {
        title: "Conservation of Momentum",
        type: "Article",
        difficulty: "Intermediate",
        url: "https://courses.lumenlearning.com/suny-physics/chapter/8-3-conservation-of-momentum/",
      },
      {
        title: "Elastic and Inelastic Collisions",
        type: "Blog Post",
        difficulty: "Beginner",
        url: "https://physics.stackexchange.com/questions/11778/elastic-vs-inelastic-collisions",
      },
    ],
    videoResources: [
      {
        title: "What is Momentum?",
        duration: "5 minutes",
        platform: "YouTube",
        topic: "Introduction to Momentum",
        url: "https://www.youtube.com/watch?v=Ii68_RO6RzQ",
        description:
          "Clear explanation of momentum concept with visual examples and real-world applications",
      },
      {
        title: "Conservation of Momentum",
        duration: "7 minutes",
        platform: "Khan Academy",
        topic: "Applying the conservation of momentum to solve problems",
        url: "https://www.khanacademy.org/science/physics/linear-momentum/momentum-tutorial/v/introduction-to-momentum",
        description:
          "Step-by-step problem solving using conservation of momentum with collision examples",
      },
    ],
    practiceExercises: [
      {
        title: "Momentum Calculation Problems",
        type: "Practice",
        estimatedTime: "20 minutes",
        description:
          "Solve 5 numerical problems involving momentum calculations, impulse calculations, and conservation of momentum in one-dimensional collisions. Problems include both elastic and inelastic collision scenarios.",
        learningObjective:
          "Apply momentum formulas and conservation principles to solve quantitative problems",
        expectedOutcome:
          "Students will be able to calculate momentum, impulse, and final velocities in collision problems with 80% accuracy",
      },
      {
        title: "Egg Drop Challenge Reflection",
        type: "Observation",
        estimatedTime: "15 minutes",
        description:
          "Write a detailed analysis of the egg drop experiment, explaining which design strategies were most effective and why. Connect the experiment results to the concepts of impulse and momentum change.",
        learningObjective:
          "Connect experimental observations to theoretical physics concepts",
        expectedOutcome:
          "Students will be able to explain how impulse reduction strategies work in real-world applications",
      },
    ],
  },
};

// Alternative test data for Computer Science topic
export const mockCurriculumSuggestionCS = {
  id: "CS101-IntroAlgo",
  lessonStructure: {
    title: "Unlocking the Power of Algorithms: A Hands-On Introduction",
    duration: "60 minutes",
    objectives: [
      "Understand the fundamental concept of an algorithm.",
      "Identify different types of algorithms.",
      "Appreciate the role of algorithms in everyday applications.",
    ],
    phases: [
      {
        name: "Hook & Engagement",
        duration: "10 minutes",
        activities: [
          "Start with a quick 'Human Sorting' game (details in experiment).",
          "Pose the question: 'How do you think Google Maps finds the fastest route?'",
        ],
      },
      {
        name: "Core Content Delivery",
        duration: "35 minutes",
        activities: [
          "Define algorithm with simple, relatable examples (making tea, following a recipe).",
          "Introduce different algorithm types: Searching (Linear, Binary), Sorting (Bubble, Selection).",
          "Illustrate each type with visual aids (flowcharts, diagrams).",
          "Discuss pseudocode as a way to represent algorithms.",
          "Use real-world examples: Recommendation systems, GPS navigation.",
        ],
      },
      {
        name: "Practice & Application",
        duration: "10 minutes",
        activities: [
          "'Algorithm Challenge': Students write pseudocode for a simple task (e.g., finding the largest number in a list).",
          "Peer review: Students exchange pseudocode and identify potential issues or improvements.",
        ],
      },
      {
        name: "Wrap-up & Preview",
        duration: "5 minutes",
        activities: [
          "Recap key concepts: Definition, types, pseudocode.",
          "Preview the next lecture: Algorithm analysis (time and space complexity).",
          "Assign reading material about real world usage of algorithms in Indian context.",
        ],
      },
    ],
  },
  experiment: {
    title: "Human Sorting Algorithm",
    duration: "8 minutes",
    materials: ["Index cards", "Markers"],
    procedure: [
      "Prepare index cards with random numbers written on them (one number per card).",
      "Distribute one card to each student.",
      "Instruct students to physically arrange themselves in ascending order based on the number on their card.",
      "Time the activity and ask students to reflect on the strategies they used to sort themselves (e.g., comparing numbers, swapping positions).",
      "Repeat using a different sorting method (e.g., having a designated 'sorter' move students around).",
    ],
    expectedOutcome:
      "Students will experience a sorting algorithm in action and understand the need for efficient algorithms.",
  },
  openingRemarks: {
    curiosityQuestion:
      "Have you ever wondered how online shopping websites recommend products you might like?",
    curiosityAnswer:
      "The algorithms behind online recommendations analyze your purchase history, browsing behavior, and demographic data to predict what you might be interested in buying. They use techniques like collaborative filtering and content-based filtering to identify patterns and make suggestions.",
    funFact:
      "The word 'algorithm' comes from the name of the 9th-century Persian mathematician, Muhammad ibn Musa al-Khwarizmi! He is considered the 'father of algebra'.",
    relatedStory:
      "The Indian government uses algorithms extensively in various sectors. For example, Aadhaar uses algorithms for biometric authentication and deduplication to ensure uniqueness.",
    industryConnection:
      "Indian startups like Flipkart and Ola use algorithms extensively for recommendation systems, fraud detection, and optimizing delivery routes. TCS, Infosys, and Wipro are also heavily involved in developing and implementing algorithms for various clients globally.",
  },
  postLectureResources: {
    readingMaterials: [
      {
        title: "Algorithms: A Common-Sense Approach",
        type: "Blog Post",
        difficulty: "Beginner",
        url: "https://medium.com/@george.seif94/a-simple-introduction-to-algorithms-b3c09856a60d",
      },
      {
        title: "Introduction to Algorithms (CLRS)",
        type: "Book Chapter",
        difficulty: "Intermediate",
      },
      {
        title: "Design and Analysis of Algorithms",
        type: "Research Paper",
        difficulty: "Advanced",
      },
    ],
    videoResources: [
      {
        title: "What is an Algorithm?",
        duration: "5 minutes",
        platform: "YouTube",
        topic: "Introduction to Algorithms",
        url: "https://www.youtube.com/watch?v=6hfOvs8pY1k",
        description:
          "This video explains the basic concept of algorithms using simple examples.",
      },
      {
        title: "Binary Search Algorithm",
        duration: "8 minutes",
        platform: "YouTube",
        topic: "Searching Algorithms",
        url: "https://www.youtube.com/watch?v=oCirk-usBGo",
        description:
          "A detailed explanation of the binary search algorithm with visual examples.",
      },
    ],
    practiceExercises: [
      {
        title: "Finding the Maximum Number",
        type: "Practice",
        estimatedTime: "15 minutes",
        description:
          "Write an algorithm (in pseudocode) to find the largest number in a list of numbers. Test your algorithm with different lists.",
        learningObjective:
          "Understand the process of designing and implementing a simple algorithm.",
        expectedOutcome:
          "Students should be able to write pseudocode that correctly identifies the largest number in a given list.",
      },
      {
        title: "Implementing Bubble Sort",
        type: "Practice",
        estimatedTime: "45 minutes",
        description:
          "Write a C/Python program to implement the Bubble Sort algorithm. Test your program with different datasets.",
        learningObjective:
          "Able to implement bubble sort algorithm in C or Python language.",
        expectedOutcome:
          "Students should be able to sort the dataset using bubble sort algorithm.",
      },
    ],
  },
};

// Function to simulate API response for testing
export const getMockCurriculumSuggestion = (subject: string = "physics") => {
  if (
    subject.toLowerCase().includes("computer") ||
    subject.toLowerCase().includes("cs")
  ) {
    return {
      curriculumSuggestions: JSON.stringify(mockCurriculumSuggestionCS),
    };
  }
  return {
    curriculumSuggestions: JSON.stringify(mockCurriculumSuggestion),
  };
};

// For easy testing in your component
export const testCurriculumData = mockCurriculumSuggestion;
