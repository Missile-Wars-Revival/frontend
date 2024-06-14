//
//  Live_ActivitiesLiveActivity.swift
//  Live-Activities
//
//  Created by Tristan Hill on 14/06/2024.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct Live_ActivitiesAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
        var timeTillImpact: TimeInterval // New property to hold time till impact
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

struct Live_ActivitiesLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: Live_ActivitiesAttributes.self) { context in
            // Function to get time till impact (to be implemented)
            let timeRemaining = getTimeTillImpact() // Placeholder function

            // Lock screen/banner UI goes here
            VStack {
                Text("Time till impact: \(formattedTime(timeRemaining))")
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here. Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }

    // Helper function to format time interval into a readable string
    private func formattedTime(_ timeInterval: TimeInterval) -> String {
        let formatter = DateComponentsFormatter()
        formatter.unitsStyle = .abbreviated
        formatter.allowedUnits = [.minute, .second]
        return formatter.string(from: timeInterval) ?? ""
    }

    // Placeholder function to get time till impact
    private func getTimeTillImpact() -> TimeInterval {
        // Implement your logic to calculate time till impact here
        // Example:
        return 120 // 2 minutes till impact (for demonstration)
    }
}

extension Live_ActivitiesAttributes {
    fileprivate static var preview: Live_ActivitiesAttributes {
        Live_ActivitiesAttributes(name: "World")
    }
}

extension Live_ActivitiesAttributes.ContentState {
    fileprivate static var smiley: Live_ActivitiesAttributes.ContentState {
        Live_ActivitiesAttributes.ContentState(emoji: "😀", timeTillImpact: 120)
    }
    
    fileprivate static var starEyes: Live_ActivitiesAttributes.ContentState {
        Live_ActivitiesAttributes.ContentState(emoji: "🤩", timeTillImpact: 180)
    }
}

#Preview("Notification", as: .content, using: Live_ActivitiesAttributes.preview) {
   Live_ActivitiesLiveActivity()
} contentStates: {
    Live_ActivitiesAttributes.ContentState.smiley
    Live_ActivitiesAttributes.ContentState.starEyes
}
