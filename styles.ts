import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  header: {
    fontSize: 24,
    color: "#333",
    textAlign: "center",
    paddingTop: 20,
    paddingBottom: 10,
  },
  map: {
    flex: 1,
  },
  dropdownButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    borderRadius: 5,
    backgroundColor: "#ffffff",
    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    padding: 10,
  },
  dropdownButtonText: {
    fontSize: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 5,
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#f4f4f4",
    width: 200,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
  },
});
