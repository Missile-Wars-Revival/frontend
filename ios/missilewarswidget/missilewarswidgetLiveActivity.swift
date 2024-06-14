//
//  missilewarswidgetLiveActivity.swift
//  missilewarswidget
//
//  Created by Tristan Hill on 14/06/2024.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct missilewarswidgetAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var timeLeft: String
        var playerCount: Int
        var missileImageName: String  // Changed from Image to String
    }

    var name: String
}

struct missilewarswidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: missilewarswidgetAttributes.self) { context in
            VStack {
                Text("Missile Impact")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading) {
                        Text("Missile Status")
                        Image(systemName: context.state.missileImageName) // Use Image initializer
                            .resizable()
                            .scaledToFit()
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing) {
                        Text("Target Data")
                        Text("Players in firing location: \(context.state.playerCount)")
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack {
                        Text("Time till impact: \(context.state.timeLeft)")
                    }
                    .padding()
                    .background(Color.gray)
                    .cornerRadius(10)
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.playerCount)")
            } minimal: {
                Text("🚀")
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension missilewarswidgetAttributes {
    fileprivate static var preview: missilewarswidgetAttributes {
        missilewarswidgetAttributes(name: "World")
    }
}

extension missilewarswidgetAttributes.ContentState {
    fileprivate static var preview: missilewarswidgetAttributes.ContentState {
        missilewarswidgetAttributes.ContentState(timeLeft: "10s", playerCount: 4, missileImageName: "missile")
    }
}

// Preview configuration
#Preview("Notification", as: .content, using: missilewarswidgetAttributes.preview) {
    missilewarswidgetLiveActivity()
} contentStates: {
    missilewarswidgetAttributes.ContentState.preview
}
