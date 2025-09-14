# Football Chart v2.0 - New Features Demo

## 🏈 What's New in Version 2.0

### 1. Vertical 30-Yard Field
The field is now oriented vertically with proper proportions:
- **30 yards of main field** (instead of full 100-yard field)
- **6-yard end zones** on each end
- **Realistic width-to-length ratio** for better play visualization
- **Better mobile experience** with vertical scrolling

### 2. Default Lineups
Five professionally designed formations are now available with one click:

#### **I-Formation** 
Classic running formation with fullback and tailback
- QB under center
- FB at 7 yards
- RB at 9 yards
- Standard offensive line
- TE on the right
- Split ends left and right

#### **Shotgun**
Modern spread formation for passing plays
- QB in shotgun (5 yards back)
- RB offset to the left
- Four receivers spread wide
- No tight end

#### **Pistol**
Hybrid formation combining shotgun and I-formation
- QB at 3 yards back
- RB directly behind QB at 7 yards
- TE on the right
- Three receivers

#### **Wildcat**
Trick formation with RB taking direct snaps
- RB/QB in QB position
- Second RB offset
- Two tight ends
- Two receivers

#### **Goal Line**
Heavy formation for short-yardage situations
- QB under center
- FB and RB stacked
- Three tight ends
- Compressed formation

### 3. Custom Lineup Management
Create and save your own formations:
- **Save any formation** you create
- **Name your lineups** for easy identification
- **Load saved lineups** to start new plays
- **Delete old lineups** you no longer need
- **Persistent storage** - lineups saved between sessions

## 🚀 How to Use the New Features

### Starting with a Default Lineup
1. Go to the Chart page
2. Look for the "Default Lineups" section in the toolbar
3. Click any formation button (I-Formation, Shotgun, etc.)
4. The field will instantly populate with properly positioned players
5. Customize as needed and save your play

### Creating and Saving Custom Lineups
1. Place players on the field using the Position tool
2. Arrange them in your desired formation
3. Enter a name in the "Lineup name" field
4. Click "Save Lineup"
5. Your formation appears in the "Custom Lineups" section
6. Use "Load" to apply it to a clean field anytime

### Benefits for Coaches
- **Faster play creation**: Start with realistic formations
- **Consistent positioning**: Professional player spacing
- **Formation library**: Build a collection of your favorite setups
- **Teaching tool**: Show players proper alignment
- **Game planning**: Quickly test multiple formations

## 🎯 Tips for Success

### Formation Strategy
- **Use I-Formation** for power running plays
- **Use Shotgun** for quick passing and spread concepts
- **Use Pistol** for RPO (Run-Pass-Option) plays
- **Use Wildcat** for misdirection and trick plays
- **Use Goal Line** for short-yardage and goal line situations

### Custom Lineup Ideas
- **Red Zone formations** (compressed field lineups)
- **Special teams formations** (punt, kick return, etc.)
- **Defensive formations** (if you coach defense too)
- **Youth-specific formations** (8-man, 6-man football)
- **Practice drill setups**

### Workflow Suggestions
1. **Create base formations** first and save as lineups
2. **Load a formation** when creating new plays
3. **Focus on routes and concepts** rather than positioning
4. **Save successful plays** to your library
5. **Print formation sheets** for your players

## 🔧 Technical Notes

### Field Dimensions
- **Total height**: 42 yards (30 + 6 + 6)
- **Field width**: 53.3 yards (regulation)
- **Proportional scaling** maintains realistic spacing
- **Hash marks** at proper field positions

### Storage
- **Default lineups** are built into the application
- **Custom lineups** are saved in browser local storage
- **Cross-device note**: Custom lineups are device-specific
- **Backup tip**: Export important lineups as JSON files

### Performance
- **Instant loading** of default formations
- **Smooth animations** when switching lineups
- **Responsive design** works on all devices
- **Touch-optimized** for mobile use

---

**Ready to design plays like a pro? Load a formation and start creating!** 🏈

---

## 🚀 Version 3.0 - Advanced Interactive Features

### Enhanced Position Selection System
When you select a position, you now have three action modes:

#### Move Mode (Default)
- **Usage**: Click and drag positions to move them around the field
- **Visual**: Standard cursor

#### Route Mode
- **Usage**: Click a position, then drag to draw a route with arrows
- **Features**: 
  - Multi-segment routes (continue drawing by moving mouse)
  - Collision avoidance (routes avoid going through other positions)
  - Finish route with double-click, Enter key, or "Finish Route" button
  - Remove last segment with Backspace or "Remove Segment" button

#### Block Mode  
- **Usage**: Click a position, then drag to draw blocking assignments
- **Features**:
  - T-bar style indicators show blocking direction
  - Multi-segment blocking schemes
  - Same controls as routes for finishing/editing

### Collision Avoidance System
- **Smart routing**: Routes and blocks automatically avoid going through player positions
- **Toggle control**: Checkbox in Action Mode section to enable/disable
- **25px detection**: Uses intelligent collision detection around positions
- **Override capability**: Disable when you need lines to go through positions

### Advanced Keyboard Controls
- **Delete**: Remove selected element
- **Enter**: Finish current route/block
- **Backspace**: Remove last segment from current route/block
- **Escape**: Cancel current route/block drawing

### Professional Drawing Tools
- **Routes**: Solid lines with arrow heads indicating direction
- **Blocks**: Solid lines with T-bar indicators at segment ends
- **Multi-segment**: Continue drawing complex patterns
- **Precision control**: Smart point spacing prevents overlapping

### Usage Instructions

1. **Load Formation**: Click "Linemen Only" or any default lineup
2. **Select Action**: Choose Move, Route, or Block mode
3. **Draw Schemes**: 
   - Click a position to start
   - Drag to draw the path
   - Continue moving to add segments
   - Double-click or press Enter to finish

### Customization Options
- **Edit formations**: Modify `js/lineups.js` for custom lineups
- **Toggle features**: Enable/disable collision avoidance as needed
- **Save custom**: Create and save your own formation sets
