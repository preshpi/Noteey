"use client";
import ProtectedRoute from "@/app/ProtectedRoute";
import Card from "@/app/components/Card";
import Input from "@/app/components/Input";
import TopBar from "@/app/components/TopBar";
import React, { useEffect, useState } from "react";
import { BiSearch } from "react-icons/bi";
import { Toaster, toast } from "sonner";
import { BiPlus } from "react-icons/bi";
import CreateNoteModal from "@/app/components/Modals/CreateNoteModal";
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/app/firebase";
import moment from "moment";
import { useAuthState } from "react-firebase-hooks/auth";
import Footer from "@/app/components/Footer";

const Notes = () => {
  const [user, loading] = useAuthState(auth);
  const [createModal, setCreateModal] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);

  const formatTimestamp = (timestamp: Timestamp): string | null => {
    if (timestamp) {
      const seconds = timestamp.seconds;
      const nanoseconds = timestamp.nanoseconds / 1000000;
      const date = new Date(seconds * 1000 + nanoseconds);
      return moment(date).format("YYYY-MM-DD");
    }
    return "";
  };

  const handleFetchNote = async () => {
    if (user && !loading) {
      const userDocRef = doc(db, "user", user?.uid); // Reference to the user document
      const noteCollectionRef = collection(userDocRef, "note"); // Reference to the "note" subcollection
      const notesQuery = query(noteCollectionRef, orderBy("timestamp", "desc"));
      try {
        const querySnapshot = await getDocs(notesQuery);
        const notesData: React.SetStateAction<any[]> = [];
        querySnapshot.forEach((doc) => {
          notesData.push({ id: doc.id, ...doc.data() });
        });
        //apply the formate function to the timestamp inside the data directly
        const formattedNotes = notesData.map((data) => ({
          ...data,
          date: formatTimestamp(data.timestamp),
        }));

        setNotes(formattedNotes);
      } catch (error) {
        toast.error("Error fetching notes");
      }
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (user) {
      const userDocRef = doc(db, "user", user.uid);
      const cardDocRef = doc(userDocRef, "note", id);

      try {
        await deleteDoc(cardDocRef);
        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
        toast.success("Card Deleted successfully");
      } catch (error) {
        toast.error("Error deleting the card");
      }
    }
  };

  const handleUpdateDoc = async (id: string, newTitle: string) => {
    if (user) {
      const userDocRef = doc(db, "user", user.uid);
      const cardDocRef = doc(userDocRef, "note", id);

      try {
        await updateDoc(cardDocRef, {
          title: newTitle,
        });

        setNotes((prevNotes) =>
          prevNotes.map((note) =>
            note.id === id ? { ...note, title: newTitle } : note
          )
        );
        toast.success("Card title updated successfully");
      } catch (error) {
        toast.error("Error updating the card title");
      }
    }
  };

  const addNewNote = (newNote: any) => {
    const timestamp = Timestamp.fromDate(new Date()); // Use the current date as an example
    const formattedNote = {
      ...newNote,
      timestamp: timestamp,
      date: formatTimestamp(timestamp),
    };

    setNotes((prevNotes) => [formattedNote, ...prevNotes]);
  };

  const handleModal = () => {
    setCreateModal(true);
  };

  useEffect(() => {
    if (!loading) {
      handleFetchNote();
    }
  }, [user, loading]);

  const [color, setColor] = useState("#FFFF");
  const handlerandomColor = () => {
    const randomColors =
      "#" + Math.floor(Math.random() * 16777215).toString(16);
    setColor(randomColors);
  };

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen flex flex-col">
        <TopBar />
        <main className="flex-grow mb-8">
          <div className="max-w-[800px] mx-auto">
            <section className="flex flex-col gap-6 items-center justify-center mt-8 px-2 w-full">
              <h2 className="lg:text-5xl text-3xl text-center font-bold dark:text-[#e6e4e4]">
                <span className="dark:text-[white]">Create Your</span>{" "}
                <span className="dark:text-[white] italic">Sticky </span>
                <span className="text-[#e85444]">Notes</span>{" "}
              </h2>
            </section>
            <section className="flex items-center justify-center mt-8">
              <div className="flex items-center justify-center lg:w-[500px] md:w-[500px] border dark:border-gray-300 text-text dark:text-[#e6e4e4] rounded-lg focus-within:shadow-md">
                <span className="px-3 py-3 text-xl">
                  <BiSearch />
                </span>
                <Input
                  type="search"
                  id="search"
                  value=""
                  onChange={() => console.log("search")}
                  required
                  autoComplete="off"
                  name="search"
                  placeholder="Search here..."
                />
              </div>
            </section>
          </div>{" "}
          <section className="p-12 h-full flex flex-col items-center justify-center">
            {loading && <div className="spinner"></div>}
            <div className="flex flex-wrap gap-5 w-full justify-center">
              {notes?.map((data) => (
                <div
                  key={data.id}
                  className="w-full sm:w-1/2 lg:w-1/3 h-[250px]"
                >
                  <Card
                    id={data.id}
                    content={data.title}
                    date={data.date}
                    handleDeleteCard={handleDeleteCard}
                    handleUpdateDoc={handleUpdateDoc}
                  />
                </div>
              ))}
            </div>
          </section>
          <div className="fixed bottom-4 z-20 right-4">
            <button
              onClick={handleModal}
              className="text-white bg-[#e85444] hover:bg-[#f6695a] transition-colors duration-300 rounded-full m-3 w-16 h-16 flex items-center justify-center"
            >
              <BiPlus className="text-[45px]" />
            </button>
          </div>
          {createModal && (
            <CreateNoteModal
              show={createModal}
              content="Create a note"
              setShow={setCreateModal}
              buttonContent="Submit"
              addNewNote={addNewNote}
            />
          )}
          <Toaster position="bottom-right" richColors />
        </main>
          <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default Notes;
