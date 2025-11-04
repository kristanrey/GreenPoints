import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonLabel,
  IonToast,
  IonItem,
  IonList,
  IonText,
  IonIcon,
  IonAccordion,
  IonAccordionGroup,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";
import "./Event.css";
import {
  checkmarkCircleOutline,
  closeCircleOutline,
  trashOutline,
  createOutline,
} from "ionicons/icons";

interface Validator {
  validator_id: string;
  full_name: string;
  email: string;
}

const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [registrationType, setRegistrationType] = useState<"open" | "limited">("open");
  const [max, setMax] = useState<number | undefined>();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState("");
  const [validator, setValidator] = useState<Validator | null>(null);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // ✅ Fetch validator info
  const fetchValidator = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user || !user.user?.email) {
      setToastMsg("No logged-in user found. Please log in.");
      return;
    }

    const { data, error } = await supabase
      .from("validators")
      .select("*")
      .eq("email", user.user.email)
      .single();

    if (error) {
      console.error("Validator fetch error:", error.message);
      setToastMsg("Validator not found. Please log in again.");
      return;
    }
    setValidator(data);
  };

  // ✅ Fetch all events
  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: true });
    if (error) {
      console.error("Error fetching events:", error.message);
      setToastMsg("Failed to fetch events");
    } else {
      setEvents(data || []);
    }
  };

  // ✅ Fetch event registrations
  const fetchRegistrations = async () => {
    const { data, error } = await supabase.from("event_registrations").select("*");
    if (error) {
      console.error("Error fetching registrations:", error.message);
      setToastMsg("Failed to fetch registrations");
    } else {
      setRegistrations(data || []);
    }
  };

  // ✅ Reset form
  const resetForm = () => {
    setTitle("");
    setDesc("");
    setDate("");
    setEndDate("");
    setMax(undefined);
    setRegistrationType("open");
    setEditingEventId(null);
    setImageFile(null);
  };

  // ✅ Upload image to Supabase Storage
  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("greenpoints_event")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Image upload error:", uploadError.message);
        setToastMsg("Failed to upload image");
        return null;
      }

      const { data } = supabase.storage
        .from("greenpoints_event")
        .getPublicUrl(filePath);

      const imageUrl = data?.publicUrl || null;
      console.log("✅ Uploaded Image URL:", imageUrl);
      return imageUrl;
    } catch (err) {
      console.error("Unexpected upload error:", err);
      setToastMsg("Image upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  };

  // ✅ Create or Update Event
  const createOrUpdateEvent = async () => {
    if (!validator) {
      setToastMsg("Validator not loaded. Please wait or log in.");
      return;
    }

    if (!title.trim() || !desc.trim() || !date || !endDate) {
      setToastMsg("Title, description, start date, and end date are required");
      return;
    }

    if (registrationType === "limited" && (!max || max <= 0)) {
      setToastMsg("Max participants must be greater than 0 for limited events");
      return;
    }

    let imageUrl = null;

    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
      if (!imageUrl) {
        setToastMsg("Image upload failed. Please try again.");
        return;
      }
    }

    const formatDateTime = (d: string) => {
      const localDate = new Date(d);
      return `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")} ${String(localDate.getHours()).padStart(2, "0")}:${String(localDate.getMinutes()).padStart(2, "0")}:00`;
    };

    const eventData: any = {
      title: title.trim(),
      description: desc.trim(),
      date: formatDateTime(date),
      end_date: formatDateTime(endDate),
      registration_type: registrationType,
      max_participants: registrationType === "limited" ? max : null,
      created_by: validator.validator_id,
      created_at: new Date().toISOString(),
    };

    if (imageUrl) eventData.image_url = imageUrl;

    if (editingEventId) {
      const { error } = await supabase
        .from("events")
        .update(eventData)
        .eq("event_id", editingEventId);
      if (error) {
        console.error("Failed to update event:", error.message);
        setToastMsg("Failed to update event");
      } else {
        setToastMsg("Event updated successfully!");
        fetchEvents();
        resetForm();
      }
    } else {
      const { error } = await supabase.from("events").insert([eventData]);
      if (error) {
        console.error("Failed to create event:", error.message);
        setToastMsg("Failed to create event");
      } else {
        setToastMsg("Event created successfully!");
        fetchEvents();
        resetForm();
      }
    }
  };

  // ✅ Delete Event
  const deleteEvent = async (eventId: number) => {
    const { error } = await supabase.from("events").delete().eq("event_id", eventId);
    if (error) setToastMsg("Failed to delete event");
    else {
      setToastMsg("Event deleted successfully!");
      fetchEvents();
    }
  };

  // ✅ Start editing existing event
  const startEditing = (ev: any) => {
    setEditingEventId(ev.event_id);
    setTitle(ev.title);
    setDesc(ev.description);
    const toLocalInput = (d: string) =>
      new Date(new Date(d).getTime() - new Date(d).getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    setDate(toLocalInput(ev.date));
    setEndDate(toLocalInput(ev.end_date));
    setRegistrationType(ev.registration_type);
    setMax(ev.max_participants || undefined);
  };

  const approveUser = async (regId: number) => {
    const { error } = await supabase
      .from("event_registrations")
      .update({ status: "approved" })
      .eq("registration_id", regId);
    if (error) setToastMsg("Failed to approve registration");
    else fetchRegistrations();
  };

  const rejectUser = async (regId: number) => {
    const { error } = await supabase
      .from("event_registrations")
      .update({ status: "rejected" })
      .eq("registration_id", regId);
    if (error) setToastMsg("Failed to reject registration");
    else fetchRegistrations();
  };

  useEffect(() => {
    fetchValidator();
    fetchEvents();
    fetchRegistrations();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Admin Events</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* CREATE / UPDATE FORM */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{editingEventId ? "Update Event" : "Create New Event"}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonInput placeholder="Title" value={title} onIonChange={(e) => setTitle(e.detail.value!)} className="ion-margin-bottom" />
            <IonInput placeholder="Description" value={desc} onIonChange={(e) => setDesc(e.detail.value!)} className="ion-margin-bottom" />

            {/* Image Upload */}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="ion-margin-bottom"
            />

            {imageFile && (
              <img
                src={URL.createObjectURL(imageFile)}
                alt="preview"
                style={{ width: "100%", borderRadius: "10px", marginBottom: "10px" }}
              />
            )}

            <IonInput type="datetime-local" placeholder="Start Date" value={date} onIonChange={(e) => setDate(e.detail.value!)} className="ion-margin-bottom" />
            <IonInput type="datetime-local" placeholder="End Date" value={endDate} onIonChange={(e) => setEndDate(e.detail.value!)} className="ion-margin-bottom" />

            <IonSelect value={registrationType} placeholder="Select registration type" onIonChange={(e) => setRegistrationType(e.detail.value)} className="ion-margin-bottom">
              <IonSelectOption value="open">Open to All</IonSelectOption>
              <IonSelectOption value="limited">Limited Participants</IonSelectOption>
            </IonSelect>

            {registrationType === "limited" && (
              <IonInput
                type="number"
                placeholder="Max Participants"
                value={max !== undefined ? max.toString() : ""}
                onIonChange={(e) => setMax(e.detail.value ? Number(e.detail.value) : undefined)}
                className="ion-margin-bottom"
              />
            )}

            <IonButton expand="block" color={editingEventId ? "warning" : "success"} onClick={createOrUpdateEvent} disabled={uploading}>
              {uploading ? "Uploading..." : editingEventId ? "Update Event" : "Create Event"}
            </IonButton>
            {editingEventId && (
              <IonButton expand="block" color="medium" onClick={resetForm} className="ion-margin-top">
                Cancel Edit
              </IonButton>
            )}
          </IonCardContent>
        </IonCard>

        {/* EXISTING EVENTS */}
        <h2 className="ion-margin-top">Existing Events</h2>
        <IonAccordionGroup>
          {events.map((ev) => (
            <IonAccordion key={ev.event_id} value={ev.event_id.toString()}>
              <IonItem slot="header" color="light">
                <IonLabel>
                  <h3>{ev.title}</h3>
                  <IonText color="medium">
                    {new Date(ev.date).toLocaleString()} - {new Date(ev.end_date).toLocaleString()}
                  </IonText>
                </IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                {ev.image_url && (
                  <img
                    src={ev.image_url}
                    alt={ev.title}
                    style={{ width: "100%", borderRadius: "10px", marginBottom: "10px" }}
                  />
                )}
                <p>{ev.description}</p>
                <p>
                  <strong>Type:</strong>{" "}
                  {ev.registration_type === "limited"
                    ? `Limited (${ev.max_participants} max)`
                    : "Open to All"}
                </p>

                <IonText>
                  <strong>Participants:</strong>
                </IonText>
                <IonList>
                  {registrations
                    .filter((r) => r.event_id === ev.event_id)
                    .map((r) => (
                      <IonItem key={r.registration_id}>
                        <IonLabel>
                          {r.user_id} - {r.status}
                        </IonLabel>
                        {r.status === "pending" && (
                          <>
                            <IonButton
                              fill="clear"
                              color="success"
                              onClick={() => approveUser(r.registration_id)}
                              size="small"
                            >
                              <IonIcon icon={checkmarkCircleOutline} />
                            </IonButton>
                            <IonButton
                              fill="clear"
                              color="danger"
                              onClick={() => rejectUser(r.registration_id)}
                              size="small"
                            >
                              <IonIcon icon={closeCircleOutline} />
                            </IonButton>
                          </>
                        )}
                      </IonItem>
                    ))}
                </IonList>

                {/* Event Actions */}
                <IonButton
                  fill="outline"
                  color="warning"
                  onClick={() => startEditing(ev)}
                  className="ion-margin-end"
                >
                  <IonIcon icon={createOutline} /> Update
                </IonButton>
                <IonButton
                  fill="outline"
                  color="danger"
                  onClick={() => deleteEvent(ev.event_id)}
                >
                  <IonIcon icon={trashOutline} /> Delete
                </IonButton>
              </div>
            </IonAccordion>
          ))}
        </IonAccordionGroup>

        <IonToast
          isOpen={!!toastMsg}
          message={toastMsg}
          duration={2000}
          onDidDismiss={() => setToastMsg("")}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminEvents;
