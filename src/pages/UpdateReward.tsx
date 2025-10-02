// src/pages/UpdateReward.tsx
import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonToast,
  IonSpinner,
} from "@ionic/react";
import { useParams, useHistory } from "react-router";
import { supabase } from "../utils/supabaseClient";

interface Reward {
  id: number;
  name: string;
  points: number;
  description: string;
  image_url: string;
}

const UpdateReward: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();

  const [reward, setReward] = useState<Reward | null>(null);
  const [name, setName] = useState("");
  const [points, setPoints] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch reward by ID
  useEffect(() => {
    const fetchReward = async () => {
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching reward:", error.message);
        setToastMessage("Error loading reward.");
      } else {
        setReward(data);
        setName(data.name);
        setPoints(data.points);
        setDescription(data.description);
        setImageUrl(data.image_url);
      }
      setLoading(false);
    };

    fetchReward();
  }, [id]);

  // Handle update
  const handleUpdate = async () => {
    if (!name || !points) {
      setToastMessage("Name and Points are required!");
      return;
    }

    const { error } = await supabase
      .from("rewards")
      .update({
        name,
        points,
        description,
        image_url: imageUrl,
      })
      .eq("id", id);

    if (error) {
      console.error(error.message);
      setToastMessage("Error updating reward!");
    } else {
      setToastMessage("Reward updated successfully!");
      setTimeout(() => history.push("/create-rewards"), 1500); // Go back after save
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <IonSpinner name="crescent" />
        </IonContent>
      </IonPage>
    );
  }

  if (!reward) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <p>Reward not found.</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="warning">
          <IonTitle>Update Reward</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">Name</IonLabel>
          <IonInput
            value={name}
            onIonChange={(e) => setName(e.detail.value!)}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Points</IonLabel>
          <IonInput
            type="number"
            value={points}
            onIonChange={(e) => setPoints(Number(e.detail.value!))}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Description</IonLabel>
          <IonTextarea
            value={description}
            onIonChange={(e) => setDescription(e.detail.value!)}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Image URL</IonLabel>
          <IonInput
            value={imageUrl}
            onIonChange={(e) => setImageUrl(e.detail.value!)}
          />
        </IonItem>

        <IonButton expand="block" className="ion-margin-top" onClick={handleUpdate}>
          Update Reward
        </IonButton>

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={2000}
          onDidDismiss={() => setToastMessage("")}
        />
      </IonContent>
    </IonPage>
  );
};

export default UpdateReward;
