// src/pages/CreateRewards.tsx
import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonButton,
  IonToast,
  IonTextarea,
  IonList,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonAlert,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";

interface Reward {
  id: number;
  name: string;
  points: number;
  description: string;
  image_url: string;
  created_at: string;
}

const CreateRewards: React.FC = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [points, setPoints] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const [deleteId, setDeleteId] = useState<number | null>(null); // for delete confirm

  // Fetch rewards
  const fetchRewards = async () => {
    const { data, error } = await supabase
      .from("rewards")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching rewards:", error.message);
    } else {
      setRewards(data || []);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  // Handle form submit (create or update)
  const handleSubmit = async () => {
    if (!name || !points) {
      setToastMessage("Name and Points are required!");
      return;
    }

    if (editingId !== null) {
      // Update reward
      const { error } = await supabase
        .from("rewards")
        .update({
          name,
          points,
          description,
          image_url: imageUrl,
        })
        .eq("id", editingId);

      if (error) {
        console.error(error.message);
        setToastMessage("Error updating reward!");
      } else {
        setToastMessage("Reward updated successfully!");
        setEditingId(null);
        fetchRewards();
      }
    } else {
      // Insert new reward
      const { error } = await supabase.from("rewards").insert([
        {
          name,
          points,
          description,
          image_url: imageUrl,
        },
      ]);

      if (error) {
        console.error(error.message);
        setToastMessage("Error creating reward!");
      } else {
        setToastMessage("Reward created successfully!");
        fetchRewards();
      }
    }

    // Reset form
    setName("");
    setPoints(0);
    setDescription("");
    setImageUrl("");
  };

  // Edit button click
  const handleEdit = (reward: Reward) => {
    setEditingId(reward.id);
    setName(reward.name);
    setPoints(reward.points);
    setDescription(reward.description);
    setImageUrl(reward.image_url);
  };

  // Delete reward
  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("rewards").delete().eq("id", id);

    if (error) {
      console.error(error.message);
      setToastMessage("Error deleting reward!");
    } else {
      setToastMessage("Reward deleted successfully!");
      fetchRewards();
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonTitle>{editingId !== null ? "Update Reward" : "Create Reward"}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Form */}
        <IonItem>
          <IonLabel position="stacked">Name</IonLabel>
          <IonInput
            value={name}
            onIonChange={(e) => setName(e.detail.value!)}
            placeholder="Enter reward name"
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Points</IonLabel>
          <IonInput
            type="number"
            value={points}
            onIonChange={(e) => setPoints(Number(e.detail.value!))}
            placeholder="Enter required points"
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Description</IonLabel>
          <IonTextarea
            value={description}
            onIonChange={(e) => setDescription(e.detail.value!)}
            placeholder="Enter description"
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Image URL</IonLabel>
          <IonInput
            value={imageUrl}
            onIonChange={(e) => setImageUrl(e.detail.value!)}
            placeholder="Enter image URL"
          />
        </IonItem>

        <IonButton expand="block" onClick={handleSubmit} className="ion-margin-top">
          {editingId !== null ? "Update Reward" : "Create Reward"}
        </IonButton>

        {/* Rewards List */}
        <IonList className="ion-margin-top">
          <IonGrid>
            <IonRow>
              {rewards.map((reward) => (
                <IonCol size="12" sizeMd="6" key={reward.id}>
                  <IonCard>
                    {reward.image_url && <IonImg src={reward.image_url} />}
                    <IonCardHeader>
                      <IonCardTitle>{reward.name}</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <p><b>Points:</b> {reward.points}</p>
                      <p>{reward.description}</p>
                     <IonButton
  expand="block"
  size="small"
  routerLink={`/update-reward/${reward.id}`}
>
  Edit
</IonButton>
                      <IonButton
                        expand="block"
                        size="small"
                        color="danger"
                        onClick={() => setDeleteId(reward.id)}
                      >
                        Delete
                      </IonButton>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </IonList>

        {/* Toast Notification */}
        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={2000}
          onDidDismiss={() => setToastMessage("")}
        />

        {/* Confirm Delete */}
        <IonAlert
          isOpen={deleteId !== null}
          header="Confirm Delete"
          message="Are you sure you want to delete this reward?"
          buttons={[
            { text: "Cancel", role: "cancel", handler: () => setDeleteId(null) },
            {
              text: "Delete",
              role: "destructive",
              handler: () => {
                if (deleteId !== null) handleDelete(deleteId);
                setDeleteId(null);
              },
            },
          ]}
          onDidDismiss={() => setDeleteId(null)}
        />
      </IonContent>
    </IonPage>
  );
};

export default CreateRewards;
