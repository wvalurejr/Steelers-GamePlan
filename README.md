# Football Chart - Dynamic Play Design Tool

A modern, responsive web application for youth American football coaches to create, organize, and share plays dynamically. Built with vanilla HTML, CSS, and JavaScript for maximum compatibility and performance.

## � New Features (v2.0)

### Vertical 30-Yard Field
- **Optimized Layout**: Field now displays vertically with 30 yards + end zones
- **Realistic Proportions**: Proper football field width-to-length ratio
- **Better Mobile Experience**: Vertical orientation works better on phones and tablets

### Default Lineups
- **Pre-built Formations**: 5 standard formations with positioned players
  - I-Formation (traditional running formation)
  - Shotgun (spread passing formation)  
  - Pistol (hybrid formation)
  - Wildcat (trick formation)
  - Goal Line (short-yardage formation)
- **One-Click Setup**: Instantly load any formation to start play design
- **Professional Positioning**: Realistic player positions and proper spacing

### Custom Lineup Management
- **Save Lineups**: Save your own custom formations for reuse
- **Load Saved Lineups**: Quickly reset to any saved formation
- **Lineup Library**: Manage all your custom formations in one place
- **Easy Deletion**: Remove lineups you no longer need

## �🏈 Features

### Play Creation
- **Dynamic Canvas Drawing**: Draw positions, routes, and blocking schemes with precision
- **Multiple Drawing Tools**: Select, Position, Route, and Block tools
- **Customizable Shapes**: Circle, square, triangle, diamond, X, and line shapes
- **Color Coding**: Six-color palette for different position types and schemes
- **Position Labeling**: Add position names and player names to each element
- **Real-time Feedback**: Instant visual feedback with smooth animations

### Play Management
- **Save/Load System**: Save plays in readable JSON format for easy manual editing
- **Play Library**: Organize and browse all created plays
- **Search & Filter**: Filter plays by name, formation, and tags
- **Import/Export**: Load plays from files and export individual or multiple plays
- **Duplicate Plays**: Quickly create variations of existing plays

### Organization Tools
- **Formation Detection**: Automatic formation categorization
- **Tag System**: Organize plays with custom tags
- **Play Statistics**: Track creation and modification dates
- **Bulk Operations**: Select, export, or delete multiple plays at once

### Printing & Sharing
- **Print Layouts**: Choose from 1×1, 2×1, 2×2, or 3×2 grid layouts
- **Print Options**: Color or black & white printing with customizable font sizes
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## 🚀 Quick Start

1. **Clone or Download**: Download the project files to your local machine
2. **Open**: Open `index.html` in any modern web browser
3. **Start Creating**: Click "Create New Play" to begin designing plays

### Development Setup

For development with live reloading:

1. Install a local server (e.g., Live Server for VS Code)
2. Open the project folder in your code editor
3. Start the live server to see changes in real-time

## 🎨 Design Philosophy

### Color Scheme
- **Primary Orange**: `#FF6B35` - Action buttons and highlights
- **Black**: `#000000` - Text and secondary elements  
- **White**: `#FFFFFF` - Backgrounds and contrast
- **Field Green**: `#2d5016` - Football field background
- **Grays**: Various shades for UI elements and borders

### User Experience
- **Ultra-smooth Interactions**: Optimized animations and transitions
- **Instant Feedback**: Real-time visual responses to user actions
- **Professional Layout**: Clean, modern interface suitable for coaching environments
- **Accessibility**: High contrast colors and clear typography

## 📱 Responsive Design

The application adapts to different screen sizes:

- **Desktop** (1200px+): Full sidebar and toolbar layout
- **Tablet** (768px-1199px): Responsive grid with collapsible elements
- **Mobile** (320px-767px): Stacked layout with touch-optimized controls

## 🛠 Technical Implementation

### Architecture
- **Vanilla JavaScript**: No external dependencies for maximum compatibility
- **Modular Design**: Separate files for different functionality
- **Canvas API**: HTML5 Canvas for smooth drawing and rendering
- **Local Storage**: Browser storage for play persistence
- **CSS Grid/Flexbox**: Modern layout techniques for responsive design

### File Structure
```
FootballChart/
├── index.html              # Main application page
├── styles/
│   └── main.css            # Complete styling and responsive design
├── js/
│   ├── app.js              # Main application controller
│   ├── canvas.js           # Canvas drawing and field management
│   └── library.js          # Play library and organization
└── README.md               # This file
```

### Browser Compatibility
- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile Browsers**: Optimized touch interactions

## 🎯 Usage Guide

### Quick Start with Default Lineups

1. **Navigate to Chart Page**: Click "Chart" in the navigation or "Create New Play"
2. **Load a Formation**: Click any formation button (I-Formation, Shotgun, Pistol, Wildcat, Goal Line)
3. **Customize**: Move players, add routes, or modify the formation as needed
4. **Save Your Work**: Use "Save Play" to store the complete play

### Using Custom Lineups

1. **Create Your Formation**: Place players where you want them using the Position tool
2. **Save as Lineup**: Enter a name in the "Lineup name" field and click "Save Lineup"
3. **Reuse Anytime**: Your saved lineup appears in the Custom Lineups section
4. **Load Saved Lineup**: Click "Load" next to any saved lineup to reset the field
5. **Manage Lineups**: Delete old lineups you no longer need

### Creating a Play

1. **Start with a Formation**: Load a default or custom lineup
2. **Enter Play Name**: Type the play name in the input field
3. **Select Tools**: Choose from Select, Position, Route, or Block tools
4. **Choose Shape/Color**: Pick appropriate shapes and colors for different positions
5. **Draw Routes/Blocks**: Click and drag to draw routes or create blocking schemes
6. **Add Labels**: Enter position names (QB, RB, WR1) and player names
7. **Save Play**: Click "Save Play" to store in the library

### Drawing Tools

- **Select Tool**: Move and edit existing elements
- **Position Tool**: Place player positions with customizable shapes
- **Route Tool**: Draw running routes with automatic arrow indicators
- **Block Tool**: Create blocking assignments with dashed lines

### Managing Plays

1. **Library Page**: View all saved plays with preview thumbnails
2. **Search/Filter**: Use filters to find specific plays quickly
3. **Select Plays**: Click plays to select for bulk operations
4. **Export/Print**: Choose plays and print in various layouts
5. **Edit/Duplicate**: Modify existing plays or create variations

### Printing Plays

1. **Select Plays**: Choose plays from the library
2. **Choose Layout**: Pick grid size (1×1 for full page, 2×2 for practice sheets)
3. **Set Options**: Choose color/B&W and font size
4. **Print**: Generate print-ready coaching sheets

## 🔧 Customization

### Adding New Shapes
Edit the `drawPosition` method in `canvas.js` to add new position shapes:

```javascript
case 'new-shape':
    // Add your custom drawing code here
    break;
```

### Modifying Field Appearance
Update the `drawField` method in `canvas.js` to change field colors, lines, or layout.

### Adding Formation Types
Modify the `detectFormation` method in `app.js` to recognize new formation patterns.

## 💡 Tips for Coaches

### Best Practices
1. **Consistent Naming**: Use standard position abbreviations (QB, RB, WR1, etc.)
2. **Color Coding**: Assign consistent colors to position groups
3. **Tag Organization**: Use descriptive tags like "redzone", "3rd-down", "goal-line"
4. **Formation Groups**: Organize plays by formation for easy game planning

### Common Workflows
1. **Install Play**: Start with basic formation, add routes, save as template
2. **Create Variations**: Duplicate base plays and modify routes/assignments
3. **Game Planning**: Filter plays by formation and situation
4. **Practice Prep**: Print 2×2 layouts for easy distribution

## 🚀 Future Enhancements

Potential features for future versions:
- **Animation Playback**: Step-through play animations
- **Player Assignment**: Link plays to specific players
- **Game Situation Tags**: Down, distance, field position contexts
- **Export to PDF**: Direct PDF generation for sharing
- **Cloud Sync**: Online backup and sharing capabilities
- **Video Integration**: Link plays to game film

## 🐛 Troubleshooting

### Common Issues

**Canvas not responding on mobile:**
- Ensure touch events are enabled
- Try refreshing the page
- Check browser compatibility

**Plays not saving:**
- Verify browser supports localStorage
- Check available storage space
- Clear browser cache if needed

**Print layout issues:**
- Use print preview to check layout
- Adjust browser print settings
- Try different layout options

### Performance Tips
- Clear browser cache regularly
- Limit number of complex plays
- Use simple shapes for better mobile performance

## 📄 License

This project is open source and available under the MIT License. Feel free to modify and distribute for your coaching needs.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, suggestions, or pull requests to improve the application for the coaching community.

---

**Built for coaches, by coaches.** 🏈

Happy coaching and play designing!
